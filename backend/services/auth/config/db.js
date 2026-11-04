import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectdb = async () => {
  if (!process.env.MONGOOSE_URI) {
    console.warn("[Auth:DB] MONGOOSE_URI not provided. Running auth service in resilient mock/dev mode.");
    return false;
  }
  try {
    await mongoose.connect(process.env.MONGOOSE_URI, { serverSelectionTimeoutMS: 2000 });
    console.log("[Auth:DB] MongoDB connected successfully");
    return true;
  } catch (error) {
    console.warn(`[Auth:DB] MongoDB connection failed (${error.message}). Running auth service in resilient dev mode.`);
    return false;
  }
};

export default connectdb;