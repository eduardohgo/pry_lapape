import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { compareToken } from "../services/token.service.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const now = new Date();
    const activeSessions = (user.sessions || []).filter(
      (session) => session.expiresAt && session.expiresAt > now
    );
    const sessionsChanged = activeSessions.length !== (user.sessions || []).length;
    user.sessions = activeSessions;

    let sessionIndex = -1;
    for (let i = 0; i < user.sessions.length; i += 1) {
      const session = user.sessions[i];
      // eslint-disable-next-line no-await-in-loop
      const matches = await compareToken(token, session.tokenHash);
      if (matches) {
        sessionIndex = i;
        break;
      }
    }

    if (sessionIndex === -1) {
      if (sessionsChanged) {
        await user.save();
      }
      return res.status(401).json({ error: "Sesión expirada o inválida" });
    }

    if (sessionsChanged) {
      await user.save();
    }

    req.user = user;
    req.auth = { token, payload, sessionIndex };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function authorizeRoles(...roles) {
  const normalized = roles.map((role) => role.toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!normalized.includes(req.user.rol)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    return next();
  };
}
