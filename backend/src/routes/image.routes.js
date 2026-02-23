import express from "express";
import { protectRoute } from "../middlewares/protectRoute.middleware.js";
import {handlefileUpload} from "../middlewares/multer.middleware.js";
import { deleteGalleryImage, getGalleryImages, uploadGalleryImage } from "../controllers/image.controller.js";

const router = express.Router();

// Protected routes
router.get("/", protectRoute, getGalleryImages);
router.post( "/upload", protectRoute, handlefileUpload('file'), uploadGalleryImage);
router.delete("/:imageId", protectRoute, deleteGalleryImage);

export default router;
