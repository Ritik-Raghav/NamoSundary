import { PrismaClient } from "@prisma/client";
import { error } from "console";
import { stat } from "fs";
import slugify from "slugify";

const prisma = new PrismaClient();

// export const vendorDetails = async (req, res) => {
//   try {
//     const vendorId = req.user.id; // Assuming the vendor ID is in the request user object
//     // console.log(vendorId);

//     const vendor = await prisma.admin.findUnique({
//       where: { id: Number(vendorId) },
//       include: {
//         Product: true, // Use exact field name from schema
//         // categories: true, // Only include this if it exists in the model
//       },
//     });

//     if (!vendor) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Vendor not found" });
//     }

//     return res.status(200).json({ success: true, vendor });
//   } catch (err) {
//     console.error("Error fetching vendor details:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch vendor details",
//       error: err.message,
//     });
//   }
// };

// export const getallcategory = async (req, res) => {
//   try {
//     const categories = await prisma.mainCategory.findMany({
//       include: {
//         subCategories: true,
//       },
//     });

//     if (!categories) {
//       return res
//         .status(404)
//         .json({ success: false, message: "No categories found" });
//     }

//     return res.status(200).json({ success: true, categories });
//   } catch (err) {
//     console.error("Error fetching categories:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch categories",
//       error: err.message,
//     });
//   }
// };
