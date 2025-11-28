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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rol: {
      type: String,
      enum: ["CLIENTE", "TRABAJADOR", "DUENO", "ADMIN"],
      default: "CLIENTE",
    },

    isVerified: { type: Boolean, default: false },
    verifyCode: { type: String },
    verifyCodeExpires: { type: Date },

    twoFAEnabled: { type: Boolean, default: true },
    twoFAHash: { type: String },
    twoFAExp: { type: Date },

    resetOTPHash: { type: String },
    resetOTPExp: { type: Date },

    lastLoginAt: { type: Date },
    sessions: { type: [sessionSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.clearExpiredSessions = function clearExpiredSessions(now = new Date()) {
  if (!Array.isArray(this.sessions) || this.sessions.length === 0) return;
  this.sessions = this.sessions.filter((session) => session.expiresAt && session.expiresAt > now);
};

export default mongoose.model("User", userSchema);
