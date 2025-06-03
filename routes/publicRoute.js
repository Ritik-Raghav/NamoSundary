import express from "express";
const router = express.Router();

import {
  userLogin,
  userRegister,
  adminLogin,
  adminRegister,
  // vendorLogin,
} from "../controller/publicController.js";

// user login and registration routes
router.post("/user-login", userLogin);
router.post("/user-register", userRegister);

// admin login and registration routes
router.post("/admin-login", adminLogin);
router.post("/admin-register", adminRegister);

// Vendor login and registration routes
// router.post("/vendor-login", vendorLogin);
// router.post("/vendor-register", adminRegister);

// web pages

export default router;
