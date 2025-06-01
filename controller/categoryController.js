import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
import slugify from "slugify";

export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // multer gives you req.file.filename; build a public URL or path
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // 1️⃣ Basic validations
    if (!name?.trim() || !description?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name and description are required" });
    }

    // 2️⃣ Generate slug
    const slug = slugify(name, {
      lower: true,
      strict: true, // remove special chars
      locale: "en",
    });

    // 3️⃣ Check for existing slug
    const existing = await prisma.mainCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // 4️⃣ Create
    const category = await prisma.mainCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        imgUrl,
      },
    });

    // 5️⃣ Response
    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      category,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all categories

/**
 * @description Fetches all categories from the database in descending order of creation date.
 * @returns {object} - Response object containing an array of categories, success status, and a message.
 * @throws {InternalServerError} - If there is an error fetching categories from the database.
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.mainCategory.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update main category

export const updateMainCategory = async (req, res) => {
  try {
    const { id, name, description } = req.body;
    const file = req.file;

    // 1️⃣ id is mandatory
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Category ID is required" });
    }

    // 2️⃣ Fetch existing category
    const existingCat = await prisma.mainCategory.findUnique({
      where: { id: Number(id) },
    });
    if (!existingCat) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // 3️⃣ Build update payload dynamically
    const data = {};
    if (name?.trim()) {
      data.name = name.trim();

      // regenerate slug only if name changed
      const newSlug = slugify(name, {
        lower: true,
        strict: true,
        locale: "en",
      });
      if (newSlug !== existingCat.slug) {
        // check uniqueness (ignore yourself)
        const slugConflict = await prisma.mainCategory.findFirst({
          where: {
            slug: newSlug,
            id: { not: existingCat.id },
          },
        });
        if (slugConflict) {
          return res.status(409).json({
            success: false,
            message: "Another category already uses this slug",
          });
        }
        data.slug = newSlug;
      }
    }
    if (description?.trim()) {
      data.description = description.trim();
    }
    if (file) {
      data.imgUrl = `/uploads/${file.filename}`;
    }

    // 4️⃣ Nothing to update?
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // 5️⃣ Perform update
    const updated = await prisma.mainCategory.update({
      where: { id: Number(id) },
      data,
    });

    // 6️⃣ Return
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete main category

export const deleteMainCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ id is mandatory
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    // 2️⃣ Check if category exists
    const existingCat = await prisma.mainCategory.findUnique({
      where: { id: Number(id) },
    });
    if (!existingCat) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 3️⃣ Delete category
    await prisma.mainCategory.delete({
      where: { id: Number(id) },
    });

    // 4️⃣ Return response
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// add sub category

export const addSubCategory = async (req, res) => {
  try {
    let { mainCategoryId, name, description } = req.body;
    const file = req.file;

    // 1️⃣ Validate mainCategoryId
    if (!mainCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Main category ID is required",
      });
    }
    mainCategoryId = Number(mainCategoryId);
    if (isNaN(mainCategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mainCategoryId",
      });
    }

    // 2️⃣ Check that main category exists
    const mainCategory = await prisma.mainCategory.findUnique({
      where: { id: mainCategoryId },
    });
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: "Main category not found",
      });
    }

    // 3️⃣ Validate name & description
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }
    name = name.trim();
    description = description.trim();

    // 4️⃣ Generate slug
    const baseSlug = slugify(name, { lower: true, strict: true, locale: "en" });
    let slug = baseSlug;

    // 5️⃣ Ensure slug uniqueness under same mainCategory
    const conflict = await prisma.subCategory.findFirst({
      where: {
        mainCategoryId,
        slug,
      },
    });
    if (conflict) {
      // append a random suffix or counter
      const suffix = Math.floor(Math.random() * 9999);
      slug = `${baseSlug}-${suffix}`;
    }

    // 6️⃣ Build data payload
    const data = {
      mainCategoryId,
      name,
      slug,
      description,
    };
    if (file) {
      data.imgUrl = `/uploads/${file.filename}`;
    }

    // 7️⃣ Create sub-category
    const newSubCategory = await prisma.subCategory.create({ data });

    // 8️⃣ Respond
    return res.status(201).json({
      success: true,
      message: "Sub-category created successfully",
      subCategory: newSubCategory,
    });
  } catch (error) {
    console.error("Error creating sub-category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all sub categories

export const getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Sub-categories fetched successfully",
      subCategories,
    });
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get sub category by id

export const getSubCategoriesById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sub-category ID is required",
      });
    }

    const subCategories = await prisma.subCategory.findFirst({
      where: { id: Number(id) },
      include: { mainCategory: true },
    });

    return res.status(200).json({
      success: true,
      message: "Sub-categories fetched successfully",
      subCategories,
    });
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update sub category

export const updateSubCategory = async (req, res) => {
  try {
    let { id, mainCategoryId, name, description } = req.body;
    const file = req.file;

    // 1️⃣ Validate id (mandatory)
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sub-category ID is required",
      });
    }
    id = Number(id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sub-category ID",
      });
    }

    // 2️⃣ Fetch existing sub-category
    const existing = await prisma.subCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    // 3️⃣ Build update payload
    const data = {};

    // 4️⃣ mainCategoryId (optional) — if provided, validate
    if (mainCategoryId !== undefined) {
      mainCategoryId = Number(mainCategoryId);
      if (isNaN(mainCategoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mainCategoryId",
        });
      }
      const parent = await prisma.mainCategory.findUnique({
        where: { id: mainCategoryId },
      });
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent main category not found",
        });
      }
      data.mainCategoryId = mainCategoryId;
    }

    // 5️⃣ name & slug (optional)
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      const trimmed = name.trim();
      data.name = trimmed;

      // regenerate slug only if name changed
      const baseSlug = slugify(trimmed, {
        lower: true,
        strict: true,
        locale: "en",
      });
      if (baseSlug !== existing.slug) {
        // ensure unique under same parent
        const whereClause = { slug: baseSlug };
        if (data.mainCategoryId) {
          whereClause.mainCategoryId = data.mainCategoryId;
        } else {
          whereClause.mainCategoryId = existing.mainCategoryId;
        }
        const conflict = await prisma.subCategory.findFirst({
          where: {
            ...whereClause,
            id: { not: existing.id },
          },
        });
        if (conflict) {
          const suffix = Math.floor(Math.random() * 9999);
          data.slug = `${baseSlug}-${suffix}`;
        } else {
          data.slug = baseSlug;
        }
      }
    }

    // 6️⃣ description (optional)
    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      data.description = description.trim();
    }

    // 7️⃣ imgUrl (optional)
    if (file) {
      data.imgUrl = `/uploads/${file.filename}`;
    }

    // 8️⃣ Nothing to update?
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // 9️⃣ Perform update
    const updated = await prisma.subCategory.update({
      where: { id },
      data,
    });

    // 🔟 Respond
    return res.status(200).json({
      success: true,
      message: "Sub-category updated successfully",
      subCategory: updated,
    });
  } catch (error) {
    console.error("Error updating sub-category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// delete sub category

export const deleteSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate id (mandatory)
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Sub-category ID is required",
      });
    }
    const subCategoryId = Number(id);
    if (isNaN(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sub-category ID",
      });
    }

    // 2️⃣ Fetch existing sub-category
    const existing = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sub-category not found",
      });
    }

    // 3️⃣ Delete sub-category
    await prisma.subCategory.delete({
      where: { id: subCategoryId },
    });
    // 4️⃣ Respond
    return res.status(200).json({
      success: true,
      message: "Sub-category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sub-category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all sub categories by main category id

export const getAllSubCategoriesByMainCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Main category ID is required",
      });
    }

    const subCategories = await prisma.subCategory.findMany({
      where: { mainCategoryId: Number(categoryId) },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Sub-categories fetched successfully",
      subCategories,
    });
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
