import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

import {
  getAllUsers,
  getUserById,
  updateUserPassword,
  // getAllVendors,
  // getAllPendingVendors,
  // getVendorById,
  // updateVendorPassword,
  // updateVendorStatus,
  addBanner,
  getAllBanners,
  deleteBannerById,
  updateBannerById,
  setSettings,
  getSettings,
  getAllTransactions,
  createOrUpdatePrivacyPolicy,
  createOrUpdateTerms,
  createOrUpdateAbout,
  getPrivacyPolicy,
  getTermAndConditions,
  getAboutUs,
  getContectUsQuery,
} from "../controller/adminController.js";

import {
  addCategory,
  getAllCategories,
  updateMainCategory,
  deleteMainCategory,
  addSubCategory,
  getAllSubCategories,
  getSubCategoriesById,
  updateSubCategory,
  deleteSubCategoryById,
} from "../controller/categoryController.js";

import {
  addProduct,
  getAllProducts,
  getProductById,
  deleteProductById,
} from "../controller/productController.js";

import {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderItemStatusAdmin,
} from "../controller/cartController.js";
import { get } from "http";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// users
router.get("/all-users", getAllUsers);
router.get("/get-user/:id", getUserById);
router.put("/update-user-password", updateUserPassword);

//vendor
// router.get("/all-vendors", getAllVendors);
// router.get("/get-all-pending-vendors", getAllPendingVendors);
// router.get("/get-vendor/:id", getVendorById);
// router.put("/update-vendor-password", updateVendorPassword);
// router.put("/update-vendor-status", updateVendorStatus);

// Main category
router.post("/add-main-category", upload.single("image"), addCategory);
router.get("/get-all-main-categories", getAllCategories);
router.put("/update-main-category", upload.single("image"), updateMainCategory);
router.delete("/delete-main-category/:id", deleteMainCategory);

// Sub category
router.post("/add-sub-category", upload.single("image"), addSubCategory);
router.get("/get-all-sub-categories", getAllSubCategories);
router.get("/get-sub-category/:id", getSubCategoriesById);
router.put("/update-sub-category", upload.single("image"), updateSubCategory);
router.delete("/delete-sub-category/:id", deleteSubCategoryById);

// Product

router.post("/add-product", upload.any(), addProduct);
router.get("/get-all-products", getAllProducts);
router.get("/get-product/:id", getProductById);
router.delete("/delete-product/:id", deleteProductById);

// banners
router.post("/add-banner", upload.single("image"), addBanner);
router.get("/get-all-banners", getAllBanners);
router.delete("/delete-banner/:id", deleteBannerById);
router.put("/update-banner/:id", upload.single("image"), updateBannerById);

//orders

router.get("/get-all-orders", getAllOrdersAdmin);
router.get("/get-order/:id", getOrderByIdAdmin);
router.put("/update-order-status-admin", updateOrderItemStatusAdmin);

//settings
router.post("/set-settings", setSettings);
router.get("/get-settings", getSettings);

//transactions
router.get("/get-all-transactions", getAllTransactions);

// web pages
router.post(
  "/add-privacy-policy",
  upload.single("image"),
  createOrUpdatePrivacyPolicy
);
router.get("/get-privacy-policy", getPrivacyPolicy);

router.post(
  "/add-terms-and-conditions",
  upload.single("image"),
  createOrUpdateTerms
);
router.get("/get-terms-and-conditions", getTermAndConditions);

router.post("/add-about-us", upload.single("image"), createOrUpdateAbout);
router.get("/get-about-us", getAboutUs);
router.get("/get-contact-us-query", getContectUsQuery);

export default router;
