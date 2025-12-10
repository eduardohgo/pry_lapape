// src/controllers/auth.controller.js
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { sendMail, templates } from "../services/email.service.js";
import {
  random6,
  hashToken,
  compareToken,
  expMinutes,
  signAccessToken,
} from "../services/token.service.js";
import {
  isEmail,
  isStrongPassword,
  isValidRole,
  normalizeEmail,
} from "../utils/validators.js";
import { OAuth2Client } from "google-auth-library";

const rawMinutes = Number.parseInt(process.env.JWT_EXPIRES_MINUTES || "", 10);
const SESSION_MINUTES =
  Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 120;
const JWT_EXPIRES_IN = `${SESSION_MINUTES}m`;
const LOGIN_METHODS = ["PASSWORD_ONLY", "PASSWORD_2FA", "PASSWORD_SECRET"];

// Cliente de Google para verificar el token
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔐 Límites de seguridad (lista de cotejo)
const MAX_FAILED_LOGIN_ATTEMPTS = 5; // intentos de login
const LOGIN_LOCK_MINUTES = 15; // tiempo bloqueado

const MAX_RESET_REQUESTS = 3; // solicitudes de recuperación
const RESET_WINDOW_MINUTES = 15; // ventana para contar intentos
const RESET_BLOCK_MINUTES = 30; // bloqueo después de exceder

function resolveLoginMethod(user) {
  if (LOGIN_METHODS.includes(user.loginMethod)) return user.loginMethod;
  if (user.twoFAEnabled) return "PASSWORD_2FA";
  return "PASSWORD_ONLY";
}

function toPublicUser(user) {
  const role = (user.rol || user.role || "CLIENTE").toString().toUpperCase();
  return {
    id: user._id.toString(),
    nombre: user.nombre,
    email: user.email,
    rol: role,
    role,
    isVerified: user.isVerified,
    twoFAEnabled: user.twoFAEnabled,
    loginMethod: resolveLoginMethod(user),
    secretQuestion: user.secretQuestion,
    hasSecretQuestion: Boolean(user.secretQuestion && user.secretAnswerHash),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,

    // Info de login social
    provider: user.provider || "LOCAL",
    avatarUrl: user.avatarUrl || null,
  };
}

async function finalizeLogin(user, req) {
  const now = new Date();
  user.clearExpiredSessions(now);

  const token = signAccessToken(user, { expiresIn: JWT_EXPIRES_IN });
  const expiresAt = expMinutes(SESSION_MINUTES);
  const tokenHash = await hashToken(token);

  const session = {
    tokenHash,
    expiresAt,
    userAgent: req.get("user-agent") || "unknown",
    ipAddress: req.ip,
    createdAt: now,
  };

  user.sessions.push(session);
  user.lastLoginAt = now;

  await user.save();

  return {
    token,
    expiresAt,
    expiresInSeconds: Math.round((expiresAt.getTime() - now.getTime()) / 1000),
  };
}

export async function register(req, res, next) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || typeof nombre !== "string") {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ error: "Correo inválido" });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: "La contraseña no cumple los requisitos de seguridad" });
    }

    if (rol && !isValidRole(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    const normalizedEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const code = random6();
    const verifyCode = await hashToken(code);
    const verifyCodeExpires = expMinutes(15);

    const user = await User.create({
      nombre: nombre.trim(),
      email: normalizedEmail,
      passwordHash,
      rol: rol ? rol.toUpperCase() : undefined,
      verifyCode,
      verifyCodeExpires,
      twoFAEnabled: true,
    });

    await sendMail({
      to: normalizedEmail,
      subject: "Verifica tu cuenta | La Pape",
      html: templates.otp(code, "Código de verificación de correo"),
      devLog: `TOKEN VERIFICACIÓN: ${code}`,
    });

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para validar la cuenta.",
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedCode =
      typeof code === "string" ? code.trim() : String(code || "").trim();

    if (!isEmail(email) || !trimmedCode) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.verifyCode || !user.verifyCodeExpires) {
      return res.status(400).json({ error: "Código inválido" });
    }

    if (new Date() > user.verifyCodeExpires) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    const valid = await compareToken(trimmedCode, user.verifyCode);
    if (!valid) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    user.isVerified = true;
    user.verifyCode = undefined;
    user.verifyCodeExpires = undefined;

    await user.save();

    await sendMail({
      to: user.email,
      subject: "Cuenta verificada | La Pape",
      html: templates.accountVerified(user.nombre),
    }).catch(() => undefined);

    return res.json({ ok: true, message: "Correo verificado correctamente" });
  } catch (err) {
    return next(err);
  }
}

export async function loginStep1(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isEmail(email) || !password) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const now = new Date();

    // 🔐 Si la cuenta está bloqueada por intentos fallidos
    if (user.lockUntil && user.lockUntil > now) {
      const minutesLeft = Math.ceil((user.lockUntil - now) / 60000);
      return res.status(423).json({
        error:
          "Cuenta bloqueada por intentos fallidos. Intenta de nuevo más tarde.",
        locked: true,
        minutesLeft,
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Aumentar contador de intentos fallidos
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Bloquear si se alcanza el límite
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(
          now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000
        );
        user.failedLoginAttempts = 0;
      }

      await user.save();
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // Login correcto → limpiar bloqueos
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    if (!user.isVerified) {
      await user.save();
      return res.status(403).json({
        error: "Verifica tu correo antes de continuar",
        needEmailVerify: true,
      });
    }

    const loginMethod = resolveLoginMethod(user);

    if (loginMethod === "PASSWORD_ONLY") {
      user.twoFAEnabled = false;
      const loginResult = await finalizeLogin(user, req);
      return res.json({
        ok: true,
        stage: "done",
        ...loginResult,
        user: toPublicUser(user),
      });
    }

    if (loginMethod === "PASSWORD_SECRET") {
      if (!user.secretQuestion || !user.secretAnswerHash) {
        await user.save();
        return res.status(400).json({
          error: "No hay pregunta secreta configurada para esta cuenta",
        });
      }
      await user.save();
      return res.json({
        ok: true,
        stage: "secret-question",
        email: user.email,
        secretQuestion: user.secretQuestion,
        user: toPublicUser(user),
      });
    }

    const code = random6();
    user.loginMethod = "PASSWORD_2FA";
    user.twoFAEnabled = true;
    user.twoFAHash = await hashToken(code);
    user.twoFAExp = expMinutes(10);
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Código de acceso (2FA) | La Pape",
      html: templates.otp(code, "Tu código de acceso (2FA)"),
      devLog: `CÓDIGO 2FA: ${code}`,
    });

    return res.json({
      ok: true,
      stage: "2fa",
      needOtp: true,
      email: user.email,
      user: toPublicUser(user),
      message: "Hemos enviado un código a tu correo",
    });
  } catch (err) {
    return next(err);
  }
}

export async function loginStep2(req, res, next) {
  try {
    const { email, code } = req.body;
    const trimmedCode =
      typeof code === "string" ? code.trim() : String(code || "").trim();

    if (!isEmail(email) || !trimmedCode) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    const loginMethod = user ? resolveLoginMethod(user) : null;

    if (!user || loginMethod !== "PASSWORD_2FA") {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (!user.twoFAHash || !user.twoFAExp) {
      return res.status(400).json({ error: "No hay un código activo" });
    }

    if (new Date() > user.twoFAExp) {
      return res.status(400).json({ error: "El código 2FA ha expirado" });
    }

    const ok = await compareToken(trimmedCode, user.twoFAHash);
    if (!ok) {
      return res.status(400).json({ error: "Código 2FA incorrecto" });
    }

    user.twoFAHash = undefined;
    user.twoFAExp = undefined;

    const loginResult = await finalizeLogin(user, req);
    return res.json({ ok: true, ...loginResult, user: toPublicUser(user) });
  } catch (err) {
    return next(err);
  }
}

export async function verifySecretQuestion(req, res, next) {
  try {
    const { email, answer } = req.body;
    const trimmedAnswer = typeof answer === "string" ? answer.trim() : "";

    if (!isEmail(email) || !trimmedAnswer) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    const loginMethod = user ? resolveLoginMethod(user) : null;

    if (!user || loginMethod !== "PASSWORD_SECRET") {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (!user.secretAnswerHash || !user.secretQuestion) {
      return res.status(400).json({ error: "No hay pregunta secreta activa" });
    }

    const ok = await bcrypt.compare(trimmedAnswer, user.secretAnswerHash);
    if (!ok) {
      return res.status(400).json({ error: "Respuesta incorrecta" });
    }

    const loginResult = await finalizeLogin(user, req);
    return res.json({ ok: true, ...loginResult, user: toPublicUser(user) });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!isEmail(email)) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código",
      });
    }

    const now = new Date();

    // 🔐 Si está bloqueado por demasiadas solicitudes
    if (user.resetBlockedUntil && user.resetBlockedUntil > now) {
      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código cuando sea posible.",
      });
    }

    // Reiniciar contador si se pasó la ventana
    if (
      user.resetLastAttemptAt &&
      now.getTime() - user.resetLastAttemptAt.getTime() >
        RESET_WINDOW_MINUTES * 60 * 1000
    ) {
      user.resetAttempts = 0;
    }

    user.resetAttempts = (user.resetAttempts || 0) + 1;
    user.resetLastAttemptAt = now;

    if (user.resetAttempts > MAX_RESET_REQUESTS) {
      // Bloquear nuevas solicitudes
      user.resetBlockedUntil = new Date(
        now.getTime() + RESET_BLOCK_MINUTES * 60 * 1000
      );
      await user.save();

      return res.json({
        ok: true,
        message: "Si el correo existe, enviaremos un código cuando sea posible.",
      });
    }

    // Generar código normalmente
    const code = random6();
    user.resetOTPHash = await hashToken(code);
    user.resetOTPExp = expMinutes(10);
    user.resetBlockedUntil = undefined;

    await user.save();

    await sendMail({
      to: normalizedEmail,
      subject: "Código para recuperar contraseña | La Pape",
      html: templates.otp(code, "Recupera tu contraseña"),
      devLog: `CÓDIGO RESET: ${code}`,
    });

    return res.json({
      ok: true,
      message:
        "Si el correo existe, se envió un código (o se imprimió en consola)",
    });
  } catch (err) {
    return next(err);
  }
}

// 🔐 resetPassword con límite de 3 cambios por día
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    if (!isEmail(email) || !code || !isStrongPassword(newPassword)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user || !user.resetOTPHash || !user.resetOTPExp) {
      return res.status(400).json({ error: "Solicitud inválida" });
    }

    if (new Date() > user.resetOTPExp) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    const ok = await compareToken(code, user.resetOTPHash);
    if (!ok) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    // 🔐 Límite de cambios de contraseña por día
    const now = new Date();

    // Si es otro día distinto al último cambio, reiniciamos contador
    if (
      !user.passwordChangesDate ||
      now.toDateString() !== user.passwordChangesDate.toDateString()
    ) {
      user.passwordChangesCount = 0;
      user.passwordChangesDate = now;
    }

    // Si ya hizo 3 cambios hoy, bloqueamos el 4.º
    if ((user.passwordChangesCount || 0) >= 3) {
      return res.status(429).json({
        error:
          "Ya realizaste varios cambios de contraseña hoy. Inténtalo de nuevo más tarde.",
        tooManyPasswordChanges: true,
        limit: 3,
      });
    }

    // ✅ Cambio de contraseña permitido
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetOTPHash = undefined;
    user.resetOTPExp = undefined;
    user.twoFAHash = undefined;
    user.twoFAExp = undefined;
    user.sessions = [];
    user.lastLoginAt = undefined;

    // 🔐 Limpiar contadores de recuperación y bloqueos
    user.resetAttempts = 0;
    user.resetLastAttemptAt = undefined;
    user.resetBlockedUntil = undefined;

    // 🔐 También limpiamos bloqueos de login por si los tenía
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    // Incrementar contador de cambios de contraseña de hoy
    user.passwordChangesCount = (user.passwordChangesCount || 0) + 1;
    user.passwordChangesDate = now;

    await user.save();

    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const user = req.user;
    const sessionIndex = req.auth?.sessionIndex;

    if (typeof sessionIndex !== "number" || sessionIndex < 0) {
      return res.status(400).json({ error: "No se pudo cerrar la sesión" });
    }

    user.sessions.splice(sessionIndex, 1);
    await user.save();

    return res.json({ ok: true, message: "Sesión cerrada" });
  } catch (err) {
    return next(err);
  }
}

// 🔹 Login con Google
export async function loginWithGoogle(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Falta el token de Google" });
    }

    // 1) Verificar el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Token de Google inválido" });
    }

    const email = normalizeEmail(payload.email);
    const nombre = payload.name || payload.given_name || email.split("@")[0];
    const googleId = payload.sub;
    const avatarUrl = payload.picture;

    // 2) Buscar usuario por email
    let user = await User.findOne({ email });

    if (!user) {
      // 3) Crear usuario nuevo ligado a Google
      const randomPassword = `${googleId}.${Date.now()}`;
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        nombre,
        email,
        passwordHash,
        rol: "CLIENTE",

        isVerified: true, // Google ya verificó el correo

        provider: "GOOGLE",
        providerId: googleId,
        avatarUrl,
        twoFAEnabled: false,
        loginMethod: "PASSWORD_ONLY",
      });
    } else {
      // 4) Actualizar campos si ya existe
      if (!user.provider) user.provider = "LOCAL";
      if (!user.providerId) user.providerId = googleId;
      if (!user.isVerified && payload.email_verified) {
        user.isVerified = true;
      }
      if (!user.avatarUrl && avatarUrl) {
        user.avatarUrl = avatarUrl;
      }

      await user.save();
    }

    // 5) Crear sesión normal con tu JWT
    const loginResult = await finalizeLogin(user, req);

    return res.json({
      ok: true,
      ...loginResult,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("Error en loginWithGoogle:", err);
    return next(err);
  }
}

export async function updateLoginMethod(req, res, next) {
  try {
    const method =
      typeof req.body?.method === "string"
        ? req.body.method.toUpperCase()
        : "";
    const question =
      typeof req.body?.question === "string"
        ? req.body.question.trim()
        : undefined;
    const answer =
      typeof req.body?.answer === "string"
        ? req.body.answer.trim()
        : undefined;

    if (!LOGIN_METHODS.includes(method)) {
      return res.status(400).json({ error: "Método de acceso inválido" });
    }

    const user = req.user;

    if (method === "PASSWORD_SECRET") {
      const finalQuestion = question ?? user.secretQuestion ?? "";
      if (!finalQuestion.trim()) {
        return res
          .status(400)
          .json({ error: "Debes definir la pregunta secreta" });
      }

      if (!answer && !user.secretAnswerHash) {
        return res
          .status(400)
          .json({ error: "Debes definir la respuesta secreta" });
      }

      user.secretQuestion = finalQuestion.trim();
      if (answer) {
        user.secretAnswerHash = await bcrypt.hash(answer, 10);
      }
    } else {
      if (question) {
        user.secretQuestion = question;
      }
      if (answer) {
        user.secretAnswerHash = await bcrypt.hash(answer, 10);
      }
    }

    user.loginMethod = method;
    user.twoFAEnabled = method === "PASSWORD_2FA";

    if (method !== "PASSWORD_2FA") {
      user.twoFAHash = undefined;
      user.twoFAExp = undefined;
    }

    await user.save();

    return res.json({
      ok: true,
      message: "Método de inicio de sesión actualizado",
      user: toPublicUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

export function me(req, res) {
  return res.json({ ok: true, user: toPublicUser(req.user) });
}
