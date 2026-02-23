import Category from "../models/category.model.js";
import FoodItem from "../models/foodItem.model.js";

const buildSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getFoodItems = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};

    const foodItems = await FoodItem.find(filter)
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({ foodItems });
  } catch (error) {
    console.error("Get food items error:", error);
    return res.status(500).json({ message: "Failed to fetch food items" });
  }
};

export const createFoodItem = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      image,
      isAvailable,
      isVeg,
      prepTime,
    } = req.body;

    if (!categoryId || !name || price === undefined || price === null) {
      return res
        .status(400)
        .json({ message: "categoryId, name and price are required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const normalizedSlug = buildSlug(slug || name);
    if (!normalizedSlug) {
      return res.status(400).json({ message: "Invalid food item slug" });
    }

    const existing = await FoodItem.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(409).json({ message: "Food item slug already exists" });
    }

    const foodItem = await FoodItem.create({
      categoryId,
      name,
      slug: normalizedSlug,
      description: description || "",
      price: Number(price),
      image: {
        url: image?.url || "",
        publicId: image?.publicId || "",
      },
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
      isVeg: typeof isVeg === "boolean" ? isVeg : false,
      prepTime: Number.isFinite(Number(prepTime)) ? Number(prepTime) : 0,
    });

    const populated = await foodItem.populate("categoryId", "name slug");

    return res
      .status(201)
      .json({ foodItem: populated, message: "Food item created successfully" });
  } catch (error) {
    console.error("Create food item error:", error);
    return res.status(500).json({ message: "Failed to create food item" });
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      image,
      isAvailable,
      isVeg,
      prepTime,
    } = req.body;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    if (categoryId !== undefined) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      foodItem.categoryId = categoryId;
    }

    if (name !== undefined) foodItem.name = name;
    if (description !== undefined) foodItem.description = description;
    if (price !== undefined) foodItem.price = Number(price);
    if (typeof isAvailable === "boolean") foodItem.isAvailable = isAvailable;
    if (typeof isVeg === "boolean") foodItem.isVeg = isVeg;
    if (prepTime !== undefined) {
      foodItem.prepTime = Number.isFinite(Number(prepTime)) ? Number(prepTime) : 0;
    }

    if (slug !== undefined || name !== undefined) {
      const normalizedSlug = buildSlug(slug || foodItem.name);
      if (!normalizedSlug) {
        return res.status(400).json({ message: "Invalid food item slug" });
      }

      const duplicate = await FoodItem.findOne({
        slug: normalizedSlug,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Food item slug already exists" });
      }

      foodItem.slug = normalizedSlug;
    }

    if (image) {
      foodItem.image = {
        url: image.url || "",
        publicId: image.publicId || "",
      };
    }

    await foodItem.save();
    const populated = await foodItem.populate("categoryId", "name slug");

    return res
      .status(200)
      .json({ foodItem: populated, message: "Food item updated successfully" });
  } catch (error) {
    console.error("Update food item error:", error);
    return res.status(500).json({ message: "Failed to update food item" });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const foodItem = await FoodItem.findByIdAndDelete(id);

    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res.status(200).json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("Delete food item error:", error);
    return res.status(500).json({ message: "Failed to delete food item" });
  }
};
