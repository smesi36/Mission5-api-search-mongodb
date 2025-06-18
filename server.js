import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import searchRoutes from "./router/searchRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors()); // Enable CORS for all routes

const PORT = process.env.PORT || 4000;
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to Mongo database");
    
    // Middleware to parse JSON bodies
    app.use(express.json());
    
    // Mount the search API
    app.use("/", searchRoutes);

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
  }
}
startServer();
