import express from "express";
import {
  changeUserPassword,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  updateUserAvatar,
  checkEmailAvailability,
  bulkAction,
} from "../controllers/adminUser.controller.js";
import { adminOnly, protectRoute } from "../middlewares/protectRoute.middleware.js";
import { handlefileUpload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.post("/bulk-action", bulkAction);
router.get("/check-email/:email", checkEmailAvailability);
router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/avatar", handlefileUpload("file"), updateUserAvatar);
router.patch("/:id/password", changeUserPassword);
router.delete("/:id", deleteUser);

export default router;
