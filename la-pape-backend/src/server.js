// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.set("trust proxy", 1);

const FRONT = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: FRONT,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors({ origin: FRONT, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => res.json({ ok: true, name: "La Pape API (Mongo)" }));
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Error handler:", err);
  const status = err.status || err.code || 500;
  res
    .status(Number.isInteger(status) ? status : 500)
    .json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 API http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("❌ Error conectando a MongoDB:", e);
    process.exit(1);
  });
