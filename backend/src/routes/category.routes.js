import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { adminOnly, protectRoute } from "../middlewares/protectRoute.middleware.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
