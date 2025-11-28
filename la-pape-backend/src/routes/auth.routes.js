import { Router } from "express";
import {
  register,
  verifyEmail,
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
  logout,
  me,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);

router.post("/login", loginStep1);
router.post("/verify-2fa", loginStep2);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
