import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ENV } from "../config/env.js";
import { sendOtp, validateOtp } from "../services/otp.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

const getGoogleOAuthConfig = () => {
  const clientId = ENV.GOOGLE_CLIENT_ID;
  const clientSecret = ENV.GOOGLE_CLIENT_SECRET || ENV.GOOGLE_SECRET_ID;
  const redirectUri =
    ENV.GOOGLE_REDIRECT_URI ||
    "http://localhost:5000/api/auth/google/callback";

  return { clientId, clientSecret, redirectUri };
};

const getGoogleClient = () => {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is missing in backend .env");
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const sanitizeUser = (user) => {
  const plainUser = user.toObject ? user.toObject() : user;
  delete plainUser.password;
  return plainUser;
};

const issueAuthCookieAndJson = (res, user, statusCode = 200, message = "Success") => {
  const token = createToken(user);
  setAuthCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: sanitizeUser(user),
  });
};

const issueAuthCookieAndRedirect = (res, user) => {
  const jwtToken = createToken(user);
  setAuthCookie(res, jwtToken);

  const clientUrl =
    ENV.CLIENT_URL ||
    (ENV.CLIENT_URLS ? ENV.CLIENT_URLS.split(",")[0].trim() : "http://localhost:5173");

  return res.redirect(`${clientUrl}/`);
};

const redirectToLoginWithError = (res, message = "Google authentication failed") => {
  const clientUrl =
    ENV.CLIENT_URL ||
    (ENV.CLIENT_URLS ? ENV.CLIENT_URLS.split(",")[0].trim() : "http://localhost:5173");

  const query = new URLSearchParams({ error: message }).toString();
  return res.redirect(`${clientUrl}/login?${query}`);
};

const isValidEmail = (email = "") => EMAIL_REGEX.test(String(email).toLowerCase());

const isValidPassword = (password = "") => typeof password === "string" && password.length >= 8;

const getFallbackAvatarUrl = (name = "User") => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

export const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const checkEmailAvailability = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Email is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await User.findOne({ email });
    return res.status(200).json({
      success: true,
      available: !existingUser,
      message: existingUser ? "Email is already in use" : "Email is available",
    });
  } catch (error) {
    console.error("Email availability error:", error);
    return res.status(500).json({
      success: false,
      available: false,
      message: "Unable to check email availability",
    });
  }
};

export const requestSignupOtp = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and phone are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters" });
    }

    const normalizedPhone = String(phone).trim();
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const otpResult = await sendOtp({
      email: normalizedEmail,
      purpose: "signup-verification",
      payload: {
        name,
        email: normalizedEmail,
        password,
        phone: normalizedPhone,
      },
    });

    return res
      .status(otpResult.status)
      .json({ success: otpResult.status === 200, message: otpResult.message });
  } catch (error) {
    console.error("Request signup OTP error:", error);
    return res.status(500).json({ success: false, message: "Failed to send signup OTP" });
  }
};

export const signup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const otpResult = await validateOtp({
      email: normalizedEmail,
      purpose: "signup-verification",
      otp,
    });

    if (otpResult.status !== 200) {
      return res.status(otpResult.status).json({
        success: false,
        message: otpResult.message,
      });
    }

    const signupPayload = otpResult.payload || {};
    const { name, password, phone } = signupPayload;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "Signup payload expired or invalid. Request OTP again.",
      });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      isEmailVerified: true,
    });

    return issueAuthCookieAndJson(res, user, 201, "Signup successful");
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "User is blocked" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return issueAuthCookieAndJson(res, user, 200, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const requestResetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpResult = await sendOtp({ email: normalizedEmail, purpose: "reset-password" });
    return res
      .status(otpResult.status)
      .json({ success: otpResult.status === 200, message: otpResult.message });
  } catch (error) {
    console.error("Request reset OTP error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send reset OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email, OTP and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpResult = await validateOtp({ email: normalizedEmail, purpose: "reset-password", otp });
    if (otpResult.status !== 200) {
      return res
        .status(otpResult.status)
        .json({ success: false, message: otpResult.message });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
};

export const googleLogin = (req, res) => {
  const { clientId } = getGoogleOAuthConfig();
  if (!clientId) {
    return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
  }

  const client = getGoogleClient();
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  return res.redirect(authUrl);
};

export const googleCallback = async (req, res) => {
  try {
    const client = getGoogleClient();
    const { clientId } = getGoogleOAuthConfig();
    const { code } = req.query;

    if (!code) {
      console.log("Authorization code missing");
      return redirectToLoginWithError(res, "Authorization code missing");
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    if (!tokens.id_token) {
      console.log("Google ID token missing");
      return redirectToLoginWithError(res, "Google ID token missing");
    }

    // 🔍 Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const { sub, name, email, picture } = ticket.getPayload();

    // 🔎 Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // 🆕 Create new user
      user = await User.create({
        name: name || email?.split("@")[0] || "Google User",
        email,
        password: null,
        googleId: sub,
        isEmailVerified: true,
        avatar: {
          url: picture || getFallbackAvatarUrl(name || email),
        },
      });
    } else {
      const updates = {};

      if (sub && !user.googleId) {
        updates.googleId = sub;
      }

      if (picture && (!user.avatar || !user.avatar.url)) {
        updates.avatar = { url: picture };
      }

      if (!user.isEmailVerified) {
        updates.isEmailVerified = true;
      }

      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
      }
    }

    return issueAuthCookieAndRedirect(res, user);

  } catch (error) {
    console.error(error);
    return redirectToLoginWithError(res, "Google authentication failed");
  }
};
