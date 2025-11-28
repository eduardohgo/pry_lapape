// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

/* ------------------------------------------------------------------ */
/* Config básica                                                       */
/* ------------------------------------------------------------------ */
app.set("trust proxy", 1); // necesario en Render/Proxys para cookies, IP real, etc.

// Seguridad y performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

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

const corsOptions = {
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  origin: (origin, cb) => {
    // Permite peticiones de herramientas (curl, Postman) o navegadores sin origin
    if (!origin) return cb(null, true);

    let allowed = false;
    try {
      const u = new URL(origin);
      const hostname = u.hostname;

      const isExactFront = origin === FRONT;
      const isVercel = hostname.endsWith(".vercel.app");
      const isLocalhost = hostname === "localhost";

      allowed = isExactFront || isVercel || isLocalhost;
    } catch (_) {
      allowed = false;
    }

    return allowed ? cb(null, true) : cb(new Error("CORS: origin no permitido"));
  },
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ------------------------------------------------------------------ */
/* Parsers                                                            */
/* ------------------------------------------------------------------ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------------ */
/* Rutas                                                              */
/* ------------------------------------------------------------------ */
app.get("/", (_req, res) => res.json({ ok: true, name: "La Pape API (Mongo)" }));
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/auth", authRoutes);

/* ------------------------------------------------------------------ */
/* 404 & errores                                                       */
/* ------------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Error handler:", err);
  const status = Number.isInteger(err.status || err.code) ? (err.status || err.code) : 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("========================================");
      console.log(`🚀 API escuchando en      : http://localhost:${PORT}`);
      console.log(`🌐 FRONTEND_ORIGIN actual: ${FRONT}`);
      console.log("========================================");
    });
  })
  .catch((e) => {
    console.error("❌ Error conectando a MongoDB:", e);
    process.exit(1);
  });

/* ------------------------------------------------------------------ */
/* Cierre limpio                                                       */
/* ------------------------------------------------------------------ */
process.on("SIGTERM", () => {
  console.log("Recibido SIGTERM. Cerrando servidor…");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("Recibido SIGINT. Cerrando servidor…");
  process.exit(0);
});
