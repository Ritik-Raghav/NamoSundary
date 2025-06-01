import express from "express";
const router = express.Router();
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

import {
  vendorDetails,
  getallcategory,
} from "../controller/vendorController.js";
import {
  addProduct,
  getVendorProducts,
  getVendorProductsById,
} from "../controller/productController.js";

import {
  getAllOrdersVendor,
  getOrderByIdVendor,
  updateOrderItemStatusVendor,
} from "../controller/cartController.js";

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

// vendors routes

router.get("/vendor-details", vendorDetails);

// category list routes
router.get("/get-all-category", getallcategory);

// product

router.post("/add-product", upload.any(), addProduct);
router.get("/get-my-products", getVendorProducts);
router.get("/get-product/:id", getVendorProductsById);

// orders

router.get("/get-all-orders", getAllOrdersVendor);
router.get("/get-order/:id", getOrderByIdVendor);

router.put("/update-order-item-status", updateOrderItemStatusVendor);

export default router;
