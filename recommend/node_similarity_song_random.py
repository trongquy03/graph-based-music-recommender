
from neo4j import GraphDatabase
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from collections import defaultdict
from sklearn.metrics import precision_score

# Connect to Neo4j 
uri = "bolt://localhost:7687"
user = "neo4j"
password = "123456789"  

driver = GraphDatabase.driver(uri, auth=(user, password))

# Tạo đồ thị ảo cho GDS 
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

# Tính NodeSimilarity và ghi vào graph ====
def compute_similarity():
    with driver.session() as session:
        session.run("""
        CALL gds.nodeSimilarity.write('user_track_graph', {
          similarityCutoff: 0.1,
          writeRelationshipType: 'SIMILAR',
          writeProperty: 'similarity'
        })
        YIELD relationshipsWritten;
        """)

# Gợi ý bài hát từ người dùng tương tự ====
def get_recommendations(username, top_k=10):
    query = """
    MATCH (me:User {id: $username})-[:SIMILAR]->(other:User)-[:LISTENED]->(t:Song)
    WHERE NOT (me)-[:LISTENED]->(t)
    RETURN t.title AS track, COUNT(*) AS score
    ORDER BY score DESC
    LIMIT $k
    """
    with driver.session() as session:
        results = session.run(query, username=username, k=top_k)
        return [record["track"] for record in results]

#  Precision@K Evaluation 
def precision_at_k(user_id, k=10):
    with driver.session() as session:
        # Lấy tất cả track thật sự đã nghe (ground truth)
        gt_query = """
        MATCH (u:User {id: $user})-[:LISTENED]->(t:Song)
        RETURN t.title AS track
        """
        gt_tracks = {record["track"] for record in session.run(gt_query, user=user_id)}

        # Lấy top-K gợi ý
        rec_tracks = get_recommendations(user_id, top_k=k)

        # Precision@K
        hits = [1 if t in gt_tracks else 0 for t in rec_tracks]
        precision = sum(hits) / k
        return precision, rec_tracks, list(gt_tracks)

# ==== STEP 6: Trực quan hóa ====
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

# ==== RUN ====
if __name__ == "__main__":
    create_projection()
    compute_similarity()

    # Lấy user ngẫu nhiên từ DB
    with driver.session() as session:
        result = session.run("MATCH (u:User) RETURN u.id AS user_id ORDER BY rand() LIMIT 1")
        user = result.single()["user_id"]
        print(f"Randomly selected user: {user}")
    precision, recs, gt = precision_at_k(user, k=10)

    print(f"Precision@10 for {user}: {precision:.2f}")
    print("Recommendations:", recs)
    print("Ground Truth:", gt)

    visualize_similarity(user)
