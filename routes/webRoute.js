import express from "express";
const router = express.Router();

import { userAuth } from "../utils/authMiddleware.js";

import {
  getAllProductsweb,
  getProductByIdWeb,
  getProductsByMainCategoryWeb,
  getProductsBySubCategoryWeb,
  getProductsBySearchTermWeb,
} from "../controller/productController.js";

import {
  getAllCategories,
  getAllSubCategories,
  getAllSubCategoriesByMainCategory,
} from "../controller/categoryController.js";

import {
  addToCart,
  getCartItems,
  updateCartItemQuantity,
  clearCart,
  createOrder,
  getUserOrders,
  getUserOrdersById,
} from "../controller/cartController.js";

import {
  createAddress,
  getAddresses,
  setDefaultAddress,
  deleteAddress,
  updatePassword,
  updateDetails,
  addReview,
  getPrivacyPolicy,
  getTermAndConditions,
  getAboutUs,
  addContactForm,
  getUserDetails,
} from "../controller/userController.js";

import { getAllBannersWeb } from "../controller/adminController.js";

import {
  createRazorpayOrder,
  verifyPayment,
} from "../controller/paymentController.js";

// banner routes
router.get("/get-all-banners", getAllBannersWeb);

// category list routes
router.get("/get-all-category", getAllCategories);
router.get("/get-all-sub-category", getAllSubCategories);
router.get(
  "/get-all-sub-category-by-main-category/:categoryId",
  getAllSubCategoriesByMainCategory
);

// product routes
router.get("/get-all-products", getAllProductsweb);
router.get("/get-products/:id", getProductByIdWeb);
router.get(
  "/get-products-by-main-category/:categoryId",
  getProductsByMainCategoryWeb
);
router.get(
  "/get-products-by-sub-category/:categoryId",
  getProductsBySubCategoryWeb
);
router.get("/search-product/:searchTerm", getProductsBySearchTermWeb);

// get web pages
router.get("/get-privacy-policy", getPrivacyPolicy);
router.get("/get-terms-and-conditions", getTermAndConditions);
router.get("/get-about-us", getAboutUs);
router.post("/add-contact-form", addContactForm);

// protected routes

//user address
router.post("/add-address", userAuth, createAddress);
router.get("/get-address", userAuth, getAddresses);
router.patch("/set-default-address/:addressId", userAuth, setDefaultAddress);
router.delete("/delete-address/:addressId", userAuth, deleteAddress);

// cart routes
router.post("/add-to-cart", userAuth, addToCart);
router.get("/get-cart", userAuth, getCartItems);
router.patch("/quantity-update/:Id", userAuth, updateCartItemQuantity);
router.delete("/clear-cart", userAuth, clearCart);

//payment routes
router.post("/create-razorpay-order", userAuth, createRazorpayOrder);
router.post("/verify-payment", userAuth, verifyPayment);

// order routes
router.post("/create-order", userAuth, createOrder);
router.get("/get-orders", userAuth, getUserOrders);
router.get("/get-order/:orderId", userAuth, getUserOrdersById);

// password
router.put("/update-password", userAuth, updatePassword);
router.put("/update-details", userAuth, updateDetails);

//review routes
router.post("/add-review", userAuth, addReview);

// get userdetails
router.get("/userdetails", userAuth, getUserDetails);

export default router;
