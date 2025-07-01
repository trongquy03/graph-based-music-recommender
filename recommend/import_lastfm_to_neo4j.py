import pandas as pd
from neo4j import GraphDatabase
from tqdm import tqdm

# === Thay thông tin này bằng từ Neo4j Aura Console ===
NEO4J_URI = ""
NEO4J_USER = ""
NEO4J_PASSWORD = ""

# Kết nối Neo4j
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Đọc dữ liệu CSV
df = pd.read_csv("entity_has_tag_combined.csv")
df['tag'] = df['tag'].str.strip().str.lower()
df['name'] = df['name'].str.strip()

def import_tag(tx, entity_type, name, tag, weight):
    if entity_type == "Song":
        match_clause = """
            WITH t
            MATCH (e:Song {title: $name})
        """
    elif entity_type == "Artist":
        match_clause = """
            WITH t
            MATCH (e:Artist {name: $name})
        """
    else:
        raise ValueError(f"Unknown entity_type: {entity_type}")
    
    query = f"""
        MERGE (t:Tag {{name: $tag}})
        {match_clause}
        MERGE (e)-[:HAS_TAG {{weight: $weight}}]->(t)
    """
    tx.run(query, tag=tag, name=name, weight=weight)

with driver.session() as session:
    for idx, row in tqdm(df.iterrows(), total=len(df)):
        try:
            session.execute_write(
                import_tag,
                row['entity_type'],
                row['name'],
                row['tag'],
                row['weight']
            )
        except Exception as e:
            print(f"Lỗi tại dòng {idx}: {e}")

driver.close()
print(" Import tag vào Neo4j hoàn tất.")
