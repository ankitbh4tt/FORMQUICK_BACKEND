import mongoose from "mongoose";

export const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    throw new Error(`DB connection failed, ${error}`);
  }
};
