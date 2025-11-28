import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI no definido en .env");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: "lapape" });
  console.log("✅ MongoDB conectado");
}
