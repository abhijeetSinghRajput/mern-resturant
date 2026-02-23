import Category from "../models/category.model.js";

const buildSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedSlug = buildSlug(slug || name);
    if (!normalizedSlug) {
      return res.status(400).json({ message: "Invalid category slug" });
    }

    const existing = await Category.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(409).json({ message: "Category slug already exists" });
    }

    const category = await Category.create({
      name,
      slug: normalizedSlug,
      description: description || "",
      image: {
        url: image?.url || "",
        publicId: image?.publicId || "",
      },
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json({ category, message: "Category created successfully" });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ message: "Failed to create category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (typeof isActive === "boolean") category.isActive = isActive;

    if (slug !== undefined || name !== undefined) {
      const normalizedSlug = buildSlug(slug || category.name);
      if (!normalizedSlug) {
        return res.status(400).json({ message: "Invalid category slug" });
      }

      const duplicate = await Category.findOne({
        slug: normalizedSlug,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({ message: "Category slug already exists" });
      }

      category.slug = normalizedSlug;
    }

    if (image) {
      category.image = {
        url: image.url || "",
        publicId: image.publicId || "",
      };
    }

    await category.save();

    return res.status(200).json({ category, message: "Category updated successfully" });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }
};
