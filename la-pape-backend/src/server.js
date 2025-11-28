// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Render está detrás de proxy
app.set("trust proxy", 1);

/* =========================
   CORS con whitelist flexible
   ========================= */
const fromEnv = (name, fallback = "") =>
  (process.env[name] || fallback).split(",").map(s => s.trim()).filter(Boolean);

// FRONTEND_ORIGIN = https://tuapp.vercel.app
// ALLOWED_ORIGINS = http://localhost:5173, http://localhost:3000 (opcional)
const allowed = new Set([
  ...fromEnv("FRONTEND_ORIGIN"),
  ...fromEnv("ALLOWED_ORIGINS"),
]);

// Permitir opcionalmente previews de Vercel (*.vercel.app)
const allowVercelPreviews = (process.env.ALLOW_VERCEL_PREVIEWS || "false").toLowerCase() === "true";
const vercelPreviewRE = /^https?:\/\/[a-z0-9-]+(?:-.*)?\.vercel\.app$/i;

const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, cb) => {
    // Requests sin origin (curl/health checks) -> permitir
    if (!origin) return cb(null, true);

    // Whitelist exacta
    if (allowed.has(origin)) return cb(null, true);

    // Previews de vercel si están habilitados
    if (allowVercelPreviews && vercelPreviewRE.test(origin)) return cb(null, true);

    // Rechazar
    return cb(new Error(`CORS not allowed for origin: ${origin}`));
  },
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight

/* =============
   Middlewares
   ============= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =============
   Rutas
   ============= */
app.get("/", (_req, res) => res.json({ ok: true, name: "La Pape API (Mongo)" }));
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/auth", authRoutes);

/* =============
   404 y errores
   ============= */
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Error handler:", err);
  const status = Number.isInteger(err.status || err.code) ? (err.status || err.code) : 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

/* =============
   Arranque
   ============= */
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API escuchando en :${PORT} (NODE_ENV=${process.env.NODE_ENV || "dev"})`);
      if (allowed.size) {
        console.log("✅ CORS allowlist:", Array.from(allowed));
      }
      if (allowVercelPreviews) {
        console.log("✅ Previews de Vercel habilitados (*.vercel.app)");
      }
    });
  })
  .catch((e) => {
    console.error("❌ Error conectando a MongoDB:", e);
    process.exit(1);
  });
