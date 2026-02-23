import express from "express";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItems,
  updateFoodItem,
} from "../controllers/foodItem.controller.js";
import { adminOnly, protectRoute } from "../middlewares/protectRoute.middleware.js";

const router = express.Router();

router.use(protectRoute, adminOnly);

router.get("/", getFoodItems);
router.post("/", createFoodItem);
router.put("/:id", updateFoodItem);
router.delete("/:id", deleteFoodItem);

export default router;
