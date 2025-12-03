// src/routes/auth.routes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  verifyEmail,
  loginStep1,
  loginStep2,
  verifySecretQuestion,
  forgotPassword,
  resetPassword,
  logout,
  me,
  updateLoginMethod,
  loginWithGoogle,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";



const router = Router();

// 🔐 Limitadores específicos de seguridad
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máx 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de inicio de sesión. Intenta más tarde.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máx 5 solicitudes por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes de recuperación. Intenta más tarde.",
  },
});

router.post("/register", register);
router.post("/verify-email", verifyEmail);

router.post("/login", loginLimiter, loginStep1);
router.post("/verify-2fa", loginStep2);
router.post("/verify-secret", verifySecretQuestion);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

router.patch("/login-method", authenticate, updateLoginMethod);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.post("/login/google", loginLimiter, loginWithGoogle);

export default router;
