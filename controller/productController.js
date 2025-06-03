// controllers/admin/productController.js
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

// ⏫ Slug helper function
const generateUniqueSlugProduct = async (baseSlug) => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    slug = `${baseSlug}-${count}`;
    count++;
  }
};

export const addProduct = async (req, res) => {
  try {
    // 1️⃣ Parse & validate base fields
    const {
      name,
      description,
      mainCategoryId,
      subCategoryId,
      // vendorId,
      // adminId,
      variants: variantsJson,
    } = req.body;

    const adminId = req.user.id;
    console.log("adminid---", adminId);
    const missing = [];
    ["name", "mainCategoryId", "subCategoryId", "variants"].forEach((f) => {
      if (!req.body[f]) missing.push(f);
    });
    if (missing.length)
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });

    // 2️⃣ Parse & validate variants array
    let variants;
    try {
      variants = JSON.parse(variantsJson);
      if (!Array.isArray(variants) || !variants.length) throw new Error();
    } catch {
      return res.status(400).json({
        success: false,
        message: "`variants` must be a non-empty JSON array",
      });
    }

    // 3️⃣ Group uploaded files by variant index: images_0, images_1, …
    const imageMap = {};
    (req.files || []).forEach((file) => {
      const m = file.fieldname.match(/images_(\d+)/);
      const idx = m ? Number(m[1]) : 0;
      imageMap[idx] = imageMap[idx] || [];
      imageMap[idx].push(file);
    });

    // 4️⃣ Run transaction: create Product + ProductVariant(s) + VariantAttribute(s)
    const newProduct = await prisma.$transaction(async (tx) => {
      // 4.1 Create the base Product record
      const baseSlug = slugify(name, { lower: true });
      const uniqueSlug = await generateUniqueSlugProduct(baseSlug);

      const prod = await tx.product.create({
        data: {
          name,
          slug: uniqueSlug,
          description,
          mainCategoryId: Number(mainCategoryId),
          subCategoryId: Number(subCategoryId),
          // vendorId: Number(vendorId),
          adminId: Number(adminId),
        },
      });

      // 4.2 Loop through variants and handle them
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const files = imageMap[i] || [];

        const imageUrls = files.map((f) => `/uploads/${f.filename}`);

        // 4.3 Create the product variant (with optional height & weight)
        const variant = await tx.productVariant.create({
          data: {
            productId: prod.id,
            sku: v.sku,
            price: v.price.toString(),
            stock: Number(v.stock),
            images: imageUrls,
            height: v.height || null,
            weight: v.weight || null,
          },
        });

        // 4.4 Create variant attributes (if any)
        for (const attr of v.attributes || []) {
          if (attr.key && attr.value) {
            await tx.variantAttribute.create({
              data: {
                variantId: variant.id,
                key: attr.key,
                value: attr.value,
              },
            });
          }
        }
      }

      return prod;
    });

    // 5️⃣ Respond with the created product ID
    return res.status(201).json({ success: true, productId: newProduct.id });
  } catch (err) {
    console.error("addProduct error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error", success: false });
  }
};

// Get all products

// GET /products
export const getAllProducts = async (req, res) => {
  try {
    console.log("hiiiiiii");
    const products = await prisma.product.findMany({
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("products", products);

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

// GET /products/:id
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true, // ✅ Only relation fields here
          },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
};

// Get vendor products

// export const getVendorProducts = async (req, res) => {
//   const { id } = req.user;
//   try {
//     const products = await prisma.product.findMany({
//       where: { vendorId: id },
//       include: {
//         mainCategory: true,
//         subCategory: true,
//         vendor: true,
//         variants: {
//           include: {
//             attributes: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     res.status(200).json({ success: true, data: products });
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch products",
//       error: err.message,
//     });
//   }
// };

// Get all products for web

export const getAllProductsweb = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

// Get product by ID for web

export const getProductByIdWeb = async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
        // 💬 Include product reviews and the reviewer's name
        ProductReview: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // 🔥 Get related products (same subcategory, exclude current)
    const relatedRaw = await prisma.product.findMany({
      where: {
        subCategoryId: product.subCategoryId,
        id: { not: productId },
      },
      include: {
        variants: {
          select: {
            price: true,
            images: true,
          },
          take: 1,
        },
      },
      take: 5,
    });

    // 🚀 Format related products
    const relatedProducts = relatedRaw.map((prod) => {
      const variant = prod.variants[0];
      const image =
        Array.isArray(variant?.images) && variant.images.length > 0
          ? variant.images[0]
          : null;

      return {
        id: prod.id,
        name: prod.name,
        image,
        price: parseFloat(variant?.price || 0),
      };
    });

    // 🧠 Format reviews to show name, stars, comment
    const reviews = product.ProductReview.map((r) => ({
      id: r.id,
      name: r.user.name,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      data: {
        product,
        relatedProducts,
        reviews,
      },
    });
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
};

// Get products by main category for web
export const getProductsByMainCategoryWeb = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const products = await prisma.product.findMany({
      where: { mainCategoryId: parseInt(categoryId) },
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

// Get products by sub category for web

export const getProductsBySubCategoryWeb = async (req, res) => {
  const { categoryId } = req.params;
  try {
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }
    const products = await prisma.product.findMany({
      where: { subCategoryId: parseInt(categoryId) },
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

// Get products by search term for web

export const getProductsBySearchTermWeb = async (req, res) => {
  const { searchTerm } = req.params;
  try {
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      });
    }
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: searchTerm,
          // mode: "insensitive",
        },
      },
      include: {
        mainCategory: true,
        subCategory: true,
        // vendor: true,
        admin: true,
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

// Get product by ID for vendor
// export const getVendorProductsById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const vendorId = req.user.id;
//     const product = await prisma.product.findFirst({
//       where: {
//         id: parseInt(id),
//         vendorId: vendorId,
//       },
//       include: {
//         mainCategory: true,
//         subCategory: true,
//         vendor: true,
//         variants: {
//           include: {
//             attributes: true,
//           },
//         },
//       },
//     });

//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     res.status(200).json({ success: true, data: product });
//   } catch (err) {
//     console.error("Error fetching product by ID:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//       error: err.message,
//     });
//   }
// };

// Delete product by ID

export const deleteProductById = async (req, res) => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid product ID" });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            attributes: true,
          },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    // Use transaction to delete in the correct order
    await prisma.$transaction(async (tx) => {
      // Delete variant attributes
      for (const variant of product.variants) {
        await tx.variantAttribute.deleteMany({
          where: { variantId: variant.id },
        });
      }

      // Delete product variants
      await tx.productVariant.deleteMany({
        where: { productId },
      });

      // Optional: Delete OrderItems if you want a hard delete
      await tx.orderItem.deleteMany({
        where: { productId },
      });

      // Delete product
      await tx.product.delete({
        where: { id: productId },
      });
    });

    return res.status(200).json({
      status: true,
      message: "Product and related data deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Delete Product Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
