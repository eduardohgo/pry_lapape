import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export function random6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashToken(plain) {
  return bcrypt.hash(plain, 10);
}

export async function compareToken(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function expMinutes(minutes = 10) {
  const value = Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
  return new Date(Date.now() + value * 60 * 1000);
}

export function signAccessToken(user, options = {}) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.rol,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || "2h",
  });
}
