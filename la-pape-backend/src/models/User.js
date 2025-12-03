// src/models/User.js
import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },

    rol: {
      type: String,
      enum: ["CLIENTE", "TRABAJADOR", "DUENO", "ADMIN"],
      default: "CLIENTE",
    },

    // 🔹 Login social (Google)
    provider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },
    providerId: { type: String },
    avatarUrl: { type: String },

    // Verificación de cuenta
    isVerified: { type: Boolean, default: false },
    verifyCode: { type: String },
    verifyCodeExpires: { type: Date },

    // Configuración de login / 2FA
    twoFAEnabled: { type: Boolean, default: true },
    loginMethod: {
      type: String,
      enum: ["PASSWORD_ONLY", "PASSWORD_2FA", "PASSWORD_SECRET"],
      default: "PASSWORD_2FA",
    },
    secretQuestion: { type: String, trim: true },
    secretAnswerHash: { type: String },

    twoFAHash: { type: String },
    twoFAExp: { type: Date },

    // Recuperación de contraseña por OTP
    resetOTPHash: { type: String },
    resetOTPExp: { type: Date },

    // 🔐 Control de intentos de recuperación (lista de cotejo)
    resetAttempts: { type: Number, default: 0 },
    resetLastAttemptAt: { type: Date },
    resetBlockedUntil: { type: Date },

    // 🔐 Control de intentos fallidos de login (fuerza bruta)
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // Sesiones / auditoría
    lastLoginAt: { type: Date },
    sessions: { type: [sessionSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.clearExpiredSessions = function clearExpiredSessions(
  now = new Date()
) {
  if (!Array.isArray(this.sessions) || this.sessions.length === 0) return;
  this.sessions = this.sessions.filter(
    (session) => session.expiresAt && session.expiresAt > now
  );
};

export default mongoose.model("User", userSchema);
