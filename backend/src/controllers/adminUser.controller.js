import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.config.js";
import { uploadStream } from "../services/cloudinary.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const formatUser = (user) => {
  return {
    _id: user._id,
    email: user.email,
    fullName: user.name || "",
    avatar: user.avatar?.url || "",
    role: user.role,
    phone: user.phone || "",
    subscriptionId: user.subscriptionId || "",
    isBlocked: Boolean(user.isBlocked),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const [totalItems, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    return res.status(200).json({
      users: users.map(formatUser),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      password,
      role,
      phone,
      isBlocked,
    } = req.body || {};

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use" });
    }

    const displayName = fullName || name || "";

    const user = await User.create({
      name: displayName,
      email: normalizedEmail,
      password,
      role: role || "user",
      phone: phone || "",
      isBlocked: Boolean(isBlocked),
    });

    return res.status(201).json({
      message: "User created successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      name,
      email,
      role,
      phone,
      isBlocked,
    } = req.body || {};

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use" });
      }

      user.email = normalizedEmail;
    }

    if (typeof fullName === "string" || typeof name === "string") {
      user.name = fullName || name || "";
    }

    if (typeof role === "string") {
      user.role = role;
    }

    if (typeof phone === "string") {
      user.phone = phone;
    }

    if (typeof isBlocked === "boolean") {
      user.isBlocked = isBlocked;
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

export const updateUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const { secure_url, public_id } = await uploadStream(file.buffer, "users");

    user.avatar = { url: secure_url, public_id };
    await user.save();

    return res.status(200).json({
      message: "Avatar updated successfully",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Update user avatar error:", error);
    return res.status(500).json({ message: "Failed to update avatar" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    await user.deleteOne();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use", available: false });
    }

    return res.status(200).json({ message: "Email is available", available: true });
  } catch (error) {
    console.error("Check email error:", error);
    return res.status(500).json({ message: "Failed to check email" });
  }
};

export const bulkAction = async (req, res) => {
  try {
    const { userIds, action } = req.body || {};

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    if (!action || !["DELETE", "BLOCK", "UNBLOCK", "MAKE_ADMIN", "MAKE_USER"].includes(action)) {
      return res.status(400).json({ 
        message: "Invalid action. Supported: DELETE, BLOCK, UNBLOCK, MAKE_ADMIN, MAKE_USER" 
      });
    }

    // Prevent deletion of all admins
    if (action === "DELETE" || action === "BLOCK") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const targetAdminCount = await User.countDocuments({ _id: { $in: userIds }, role: "admin" });
      
      if (adminCount === targetAdminCount && adminCount > 0) {
        return res.status(400).json({ message: "Cannot delete or block all admin users" });
      }
    }

    let updateData = {};
    
    if (action === "DELETE") {
      // Delete users and their avatars from Cloudinary
      const usersToDelete = await User.find({ _id: { $in: userIds } });
      
      for (const user of usersToDelete) {
        if (user.avatar?.public_id) {
          try {
            await cloudinary.uploader.destroy(user.avatar.public_id);
          } catch (cloudinaryError) {
            console.error("Cloudinary delete error:", cloudinaryError);
          }
        }
      }
      
      await User.deleteMany({ _id: { $in: userIds } });
    } else if (action === "BLOCK") {
      updateData = { isBlocked: true };
      await User.updateMany({ _id: { $in: userIds } }, updateData);
    } else if (action === "UNBLOCK") {
      updateData = { isBlocked: false };
      await User.updateMany({ _id: { $in: userIds } }, updateData);
    } else if (action === "MAKE_ADMIN") {
      updateData = { role: "admin" };
      await User.updateMany({ _id: { $in: userIds } }, updateData);
    } else if (action === "MAKE_USER") {
      updateData = { role: "user" };
      await User.updateMany({ _id: { $in: userIds } }, updateData);
    }

    return res.status(200).json({
      message: `Bulk action '${action}' completed successfully on ${userIds.length} user(s)`,
      count: userIds.length,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    return res.status(500).json({ message: "Failed to perform bulk action" });
  }
};
