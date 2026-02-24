import express from "express";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItems,
  updateFoodItem,
} from "../controllers/foodItem.controller.js";
import { adminOnly, protectRoute } from "../middlewares/protectRoute.middleware.js";

const router = express.Router();

// Public: list food items
router.get("/", getFoodItems);

// Protected routes for admin only
router.use(protectRoute, adminOnly);

router.post("/", createFoodItem);
router.put("/:id", updateFoodItem);
router.delete("/:id", deleteFoodItem);

export default router;
