import mongoose from "mongoose";
import neo4j from "neo4j-driver";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Connected to MongoDB ${conn.connection.host}`);
    } catch (error) {
        console.log("Fail to connect to MongoDb", error);
        process.exit(1);
    
    }
}

export const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

export const neo4jLocal = neo4j.driver(
  process.env.NEO4J_LOCAL_URI,
  neo4j.auth.basic(process.env.NEO4J_LOCAL_USERNAME, process.env.NEO4J_LOCAL_PASSWORD)
);

// lib/neo4j.js hoặc db.js
export const getAuraSession = () => {
  if (neo4jDriver._closed) throw new Error("Neo4j Aura driver is closed.");
  return neo4jDriver.session();
};

export const getLocalSession = () => {
  if (neo4jLocal._closed) throw new Error("Neo4j Local driver is closed.");
  return neo4jLocal.session();
};



