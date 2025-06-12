
from neo4j import GraphDatabase
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

# Neo4j connection
uri = "bolt://localhost:7687"
user = "neo4j"
password = "123456789"
driver = GraphDatabase.driver(uri, auth=(user, password))

# Tạo projection nếu cần
def create_projection():
    with driver.session() as session:
        session.run("""
        CALL gds.graph.project(
          'user_track_graph',
          ['User', 'Song'],
          {
            LISTENED: {
              type: 'LISTENED',
              orientation: 'UNDIRECTED'
            }
          }
        );
        """)

# Tính node similarity
def compute_similarity():
    with driver.session() as session:
        session.run("""
        CALL gds.nodeSimilarity.write('user_track_graph', {
          similarityCutoff: 0.01,
          writeRelationshipType: 'SIMILAR',
          writeProperty: 'similarity'
        })
        YIELD relationshipsWritten;
        """)

# Gợi ý bài hát
def get_recommendations(username, top_k=50):
    query = """
    MATCH (me:User {id: $username})-[sim:SIMILAR]->(other:User)-[:LISTENED]->(t:Song)
    WHERE NOT (me)-[:LISTENED]->(t)
    RETURN t.title AS track, COUNT(*) AS score, avg(sim.similarity) AS avg_sim
    ORDER BY avg_sim DESC
    LIMIT $k
    """

    with driver.session() as session:
        results = session.run(query, username=username, k=top_k)
        return [record["track"] for record in results]

# Lưu RECOMMENDED
def store_recommendations(username, top_k=15):
    rec_tracks = get_recommendations(username, top_k)
    with driver.session() as session:
        for title in rec_tracks:
            session.run("""
            MATCH (u:User {id: $user}), (s:Song {title: $title})
            MERGE (u)-[:RECOMMENDED]->(s)
            """, user=username, title=title)

# Đánh giá cho 1 user
def evaluate_user(user_id, k=15):
    with driver.session() as session:
        gt_query = "MATCH (u:User {id: $user})-[:LISTENED]->(s:Song) RETURN s.title AS track"
        gt_tracks = {r["track"] for r in session.run(gt_query, user=user_id)}

        if not gt_tracks:
            return None

        rec_tracks = get_recommendations(user_id, top_k=k)
        hits = [1 if t in gt_tracks else 0 for t in rec_tracks]
        precision = sum(hits) / k
        recall = sum(hits) / len(gt_tracks) if gt_tracks else 0

        avg_precision = 0.0
        hit_count = 0
        for i, h in enumerate(hits):
            if h:
                hit_count += 1
                avg_precision += hit_count / (i + 1)
        mapk = avg_precision / min(len(gt_tracks), k)

        return {
            "user": user_id,
            "precision": precision,
            "recall": recall,
            "map": mapk
        }

# Đánh giá toàn bộ
def evaluate_all_users(k=10, limit=1000):
    with driver.session() as session:
        result = session.run(f"MATCH (u:User) RETURN u.id AS user LIMIT {limit}")
        user_ids = [r["user"] for r in result]

    results = []
    for uid in user_ids:
        res = evaluate_user(uid, k)
        if res:
            store_recommendations(uid, k)
            results.append(res)

    if results:
        avg_precision = np.mean([r["precision"] for r in results])
        avg_recall = np.mean([r["recall"] for r in results])
        avg_map = np.mean([r["map"] for r in results])
        print(f"\nTrung bình trên {len(results)} users:")
        print(f"Precision@{k}: {avg_precision:.4f}")
        print(f"Recall@{k}: {avg_recall:.4f}")
        print(f"MAP@{k}: {avg_map:.4f}")
    else:
        print("Không có user nào có dữ liệu hợp lệ.")

# Biểu đồ similarity
def visualize_similarity(username):
    query = """
    MATCH (u1:User {id: $user})-[s:SIMILAR]->(u2:User)
    RETURN u2.id AS similar_user, s.similarity AS sim
    ORDER BY sim DESC
    LIMIT 10
    """
    with driver.session() as session:
        results = session.run(query, user=username)
        data = [(r["similar_user"], r["sim"]) for r in results]

    df = pd.DataFrame(data, columns=["User", "Similarity"])
    sns.barplot(data=df, x="Similarity", y="User")
    plt.title(f"Top Similar Users to {username}")
    plt.xlabel("Similarity Score")
    plt.ylabel("User")
    plt.tight_layout()
    plt.show()

# === RUN ===
if __name__ == "__main__":
    create_projection()
    compute_similarity()
    evaluate_all_users(k=10, limit=1000)
