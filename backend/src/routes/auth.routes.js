import express from "express";
import {
	checkEmailAvailability,
	googleCallback,
	googleLogin,
	login,
	logout,
	me,
	requestSignupOtp,
	requestResetPasswordOtp,
	resetPassword,
	signup,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/protectRoute.middleware.js";
const router = express.Router();

router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.get("/check-email", checkEmailAvailability);
router.get("/me", protectRoute, me);

router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/request-reset-password-otp", requestResetPasswordOtp);
router.post("/reset-password", resetPassword);

export default router;