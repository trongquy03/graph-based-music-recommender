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

export const neo4jSession = neo4jDriver.session();