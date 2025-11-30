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

const rawMinutes = Number.parseInt(process.env.JWT_EXPIRES_MINUTES || "", 10);
const SESSION_MINUTES = Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 120;
const JWT_EXPIRES_IN = `${SESSION_MINUTES}m`;
const LOGIN_METHODS = ["PASSWORD_ONLY", "PASSWORD_2FA", "PASSWORD_SECRET"];

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
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
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
    const trimmedCode = typeof code === "string" ? code.trim() : String(code || "").trim();

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

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Verifica tu correo antes de continuar", needEmailVerify: true });
    }

    const loginMethod = resolveLoginMethod(user);

    if (loginMethod === "PASSWORD_ONLY") {
      user.twoFAEnabled = false;
      const loginResult = await finalizeLogin(user, req);
      return res.json({ ok: true, stage: "done", ...loginResult, user: toPublicUser(user) });
    }

    if (loginMethod === "PASSWORD_SECRET") {
      if (!user.secretQuestion || !user.secretAnswerHash) {
        return res
          .status(400)
          .json({ error: "No hay pregunta secreta configurada para esta cuenta" });
      }
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
    const trimmedCode = typeof code === "string" ? code.trim() : String(code || "").trim();

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
      return res.json({ ok: true, message: "Si el correo existe, enviaremos un código" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({ ok: true, message: "Si el correo existe, enviaremos un código" });
    }

    const code = random6();
    user.resetOTPHash = await hashToken(code);
    user.resetOTPExp = expMinutes(10);
    await user.save();

    await sendMail({
      to: normalizedEmail,
      subject: "Código para recuperar contraseña | La Pape",
      html: templates.otp(code, "Recupera tu contraseña"),
      devLog: `CÓDIGO RESET: ${code}`,
    });

    return res.json({ ok: true, message: "Si el correo existe, se envió un código (o se imprimió en consola)" });
  } catch (err) {
    return next(err);
  }
}

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

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetOTPHash = undefined;
    user.resetOTPExp = undefined;
    user.twoFAHash = undefined;
    user.twoFAExp = undefined;
    user.sessions = [];
    user.lastLoginAt = undefined;

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

export async function updateLoginMethod(req, res, next) {
  try {
    const method = typeof req.body?.method === "string" ? req.body.method.toUpperCase() : "";
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : undefined;
    const answer = typeof req.body?.answer === "string" ? req.body.answer.trim() : undefined;

    if (!LOGIN_METHODS.includes(method)) {
      return res.status(400).json({ error: "Método de acceso inválido" });
    }

    const user = req.user;

    if (method === "PASSWORD_SECRET") {
      const finalQuestion = question ?? user.secretQuestion ?? "";
      if (!finalQuestion.trim()) {
        return res.status(400).json({ error: "Debes definir la pregunta secreta" });
      }

      if (!answer && !user.secretAnswerHash) {
        return res.status(400).json({ error: "Debes definir la respuesta secreta" });
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
