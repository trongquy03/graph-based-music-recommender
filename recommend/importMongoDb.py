import pandas as pd
from pymongo import MongoClient
from tqdm import tqdm
import re

# === MongoDB connection ===
MONGO_URI = ""
DB_NAME = ""

songs_col = db["songs"]
artists_col = db["artists"]
albums_col = db["albums"]

# === Load CSV ===
df = pd.read_csv("metadata_with_descriptions_v6.csv")

# === Tag classification ===
genre_keywords = {'pop', 'rock', 'metal', 'hip hop', 'jazz', 'punk', 'lo-fi', 'indie', 'electronic', 'ambient', 'folk'}
country_keywords = {'vietnam', 'japan', 'us', 'canada', 'uk', 'france', 'germany', 'argentina', 'brazil', 'australian'}
mood_keywords = {'sad', 'happy', 'chill', 'relaxing', 'gloomy', 'moody', 'emotional', 'angry', 'haunting'}
era_keywords = {'80s', '90s', '2000s', '2010s', '2020s', '1970s'}

def classify_tag(tag):
    tag = tag.lower()
    if any(k in tag for k in genre_keywords):
        return "Genre"
    elif any(k in tag for k in country_keywords):
        return "Country"
    elif any(k in tag for k in mood_keywords):
        return "Mood"
    elif any(k in tag for k in era_keywords):
        return "Era"
    return "Unknown"

def extract_youtube_id(url):
    if not isinstance(url, str):
        return ""
    match = re.search(r"(?:v=|\\/)([0-9A-Za-z_-]{11})(?:&|$)", url)
    return match.group(1) if match else ""

# === Main import logic ===
for _, row in tqdm(df.iterrows(), total=len(df)):
    artist_name = str(row.get("artist_name", "") or "").strip()
    song_title = str(row.get("track_name", "") or "").strip()
    album_title = str(row.get("album", "") or "").strip()
    duration = int(row.get("duration", 0))
    youtube_url = row.get("youtube_url", "")
    image_url = row.get("song_image", "")
    description = row.get("track_description", "")
    artist_bio = row.get("artist_bio", "")

    # === Handle tags ===
    tag_objects = []
    tags_raw = row.get("tags", "")
    if isinstance(tags_raw, str):
        tag_list = [t.strip() for t in tags_raw.split(",") if t.strip()]
        tag_objects = [{"name": t, "type": classify_tag(t)} for t in tag_list]

    country_tag = next((t["name"] for t in tag_objects if t["type"] == "Country"), "")

    # === Artist ===
    artist_doc = artists_col.find_one({"name": artist_name})
    if not artist_doc:
        artist_id = artists_col.insert_one({
            "name": artist_name,
            "bio": artist_bio,
            "imageUrl": row.get("artist_image", ""),
            "country": country_tag,
            "songs": [],
            "albums": [],
            "name_normalized": artist_name.lower()
        }).inserted_id
    else:
        artist_id = artist_doc["_id"]

    # === Album ===
    album_id = None
    if album_title:
        album_doc = albums_col.find_one({"title": album_title, "artist": artist_id})
        if not album_doc:
            album_id = albums_col.insert_one({
                "title": album_title,
                "artist": artist_id,
                "imageUrl": row.get("album_image", ""),
                "releaseYear": 0,
                "songs": [],
                "title_normalized": album_title.lower(),
                "artist_normalized": artist_name.lower()
            }).inserted_id
        else:
            album_id = album_doc["_id"]

    # === Song ===
    song_doc = {
        "title": song_title,
        "artist": artist_id,
        "albumId": album_id,
        "duration": duration,
        "imageUrl": image_url,
        "description": description,
        "youtubeUrl": youtube_url,
        "tags": tag_objects,
        "genre": next((t["name"] for t in tag_objects if t["type"] == "Genre"), "pop"),
        "mood": next((t["name"] for t in tag_objects if t["type"] == "Mood"), "chill")
    }

    song_id = songs_col.insert_one(song_doc).inserted_id

    # === Cập nhật ngược về artist & album ===
    artists_col.update_one(
        {"_id": artist_id},
        {"$addToSet": {"songs": song_id}}
    )

    if album_id:
        albums_col.update_one(
            {"_id": album_id},
            {"$addToSet": {"songs": song_id}}
        )
