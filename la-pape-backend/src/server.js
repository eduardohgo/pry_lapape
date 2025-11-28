// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.set("trust proxy", 1);

// Allow configuring multiple comma-separated origins (e.g. Vercel + localhost)
const originsEnv = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "";
const allowedOrigins = originsEnv
  ? originsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server, curl
    const normalized = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    callback(new Error(`Origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
