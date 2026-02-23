import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        message: "Authentication required, jwt token is missing",
        code: "AUTH_REQUIRED",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: ENV.JWT_ISSUER,
        audience: ENV.JWT_AUDIENCE,
      });
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token",
        code: err.name || "INVALID_TOKEN",
      });
    }

    const { id } = decoded;

    if (!id) {
      return res.status(401).json({
        message: "Invalid token payload",
        code: "INVALID_PAYLOAD",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "User is blocked",
        code: "USER_BLOCKED",
      });
    }

    // ✅ Attach user only
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.clearCookie("token");

    res.status(500).json({
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
      code: "ADMIN_REQUIRED",
    });
  }
  next();
};
