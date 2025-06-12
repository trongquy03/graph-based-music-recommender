import pandas as pd
from neo4j import GraphDatabase
from tqdm import tqdm


df = pd.read_csv("Lastfm_data.csv")  

df = df.dropna(subset=["Username", "Artist", "Track"])
df["Username"] = df["Username"].str.strip().str.lower()
df["Artist"] = df["Artist"].str.strip().str.lower()
df["Track"] = df["Track"].str.strip().str.lower()

# === Kết nối Neo4j local ===
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "123456789"))  
def insert_to_neo4j(tx, username, artist, track):
    tx.run("""
        MERGE (u:User {id: $user})
        MERGE (a:Artist {name: $artist})
        MERGE (s:Song {title: $track})
        MERGE (s)-[:BY]->(a)
        MERGE (u)-[:LISTENED]->(s)
    """, user=username, artist=artist, track=track)

# === import dữ liệu ===
with driver.session() as session:
    for row in tqdm(df.itertuples(), total=len(df)):
        try:
            session.execute_write(insert_to_neo4j, row.Username, row.Artist, row.Track)
        except Exception as e:
            print("Lỗi:", e)

driver.close()
