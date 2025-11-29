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

      allowed = isExactFront || isVercel || isLocalhost;
    catch (_) {
      allowed = false;
    }

    return allowed ? cb(null, true) : cb(new Error("CORS: origin no permitido"));
  },
};

// Allow configuring multiple comma-separated origins (e.g. Vercel + localhost)
const originsEnv = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "";
const allowedOrigins = originsEnv
  ? originsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

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

// Bootstrap con try/catch explícito para evitar que versiones de Node demasiado
// nuevas interpreten mal la sintaxis de promesas en despliegues (Render está
// usando Node 25.x aunque el proyecto pide 22.x).
(async () => {
  try {
    console.log(`🧭 Node version: ${process.version}`);
    if (typeof fetch === "undefined") {
      throw new Error("'fetch' no está disponible: usa Node 18+ o agrega un polyfill");
    }

    await connectDB();

    // Arranca el servidor HTTP y deja un log sólo informativo; en Render/hosting
    // la app sigue escuchando en 0.0.0.0, por lo que no necesitas agregar nada
    // más para que sea accesible desde Internet.
    const server = app.listen(PORT, () => console.log(`🚀 API escuchando en puerto ${PORT}`));

    // Optional keep-alive ping to prevent free hosts from sleeping (e.g. Render/Railway)
    const keepAliveUrl = process.env.KEEP_ALIVE_URL;
    if (keepAliveUrl) {
      const minutes = Number(process.env.KEEP_ALIVE_INTERVAL_MINUTES || 14);
      const intervalMs = Math.max(1, minutes) * 60 * 1000;
      console.log(`🕑 Keep-alive activado: ping cada ${intervalMs / 60000} min a ${keepAliveUrl}`);

      const ping = () =>
        fetch(keepAliveUrl, { cache: "no-store" })
          .then((res) => {
            if (!res.ok) {
              console.error(`Keep-alive: respuesta no OK (${res.status})`);
            }
          })
          .catch((err) => {
            console.error(`Keep-alive falló: ${err.message}`);
          });

      ping();
      const timer = setInterval(ping, intervalMs);
      server.on("close", () => clearInterval(timer));
    }
  } catch (err) {
    console.error("❌ Error arrancando el servidor:", err);
    process.exit(1);
  }
})();
