import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";

export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user is authenticated
    const { houseNo, street, city, district, pincode } = req.body;

    // If the new address is set to default, update all existing addresses to non-default

    // Update all existing addresses for the user to be non-default
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Create the new address with the provided data
    const newAddress = await prisma.address.create({
      data: {
        userId,
        houseNo,
        street,
        city,
        district,
        pincode,
        isDefault: true, // This will be true if provided in the request body
      },
    });

    res.status(201).json({
      newAddress,
      success: true,
      message: "Address created successfully",
    }); // Return the created address
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user is authenticated

    // Retrieve all addresses for the user
    const addresses = await prisma.address.findMany({
      where: { userId, status: 1 },
    });

    res.status(200).json({
      addresses,
      success: true,
      message: "Addresses fetched successfully",
    }); // Return the list of addresses
  } catch (error) {
    console.error("Error getting addresses:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user is authenticated
    const { addressId } = req.params; // Address ID to be set as default

    // Update all existing addresses to be non-default for the user
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set the new address as default
    const updatedAddress = await prisma.address.update({
      where: { id: parseInt(addressId, 10) },
      data: { isDefault: true },
    });

    res.status(200).json({
      message: "Default address updated successfully",
      success: true,
      updatedAddress,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user is authenticated
    const { addressId } = req.params; // Address ID to be deleted

    // Delete the address
    const deletedAddress = await prisma.address.update({
      where: { id: parseInt(addressId, 10) },
      data: { status: 0 }, // Soft delete by setting status to 0
    });

    res
      .status(200)
      .json({ message: "Address deleted successfully", success: true }); // Return success message
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

// password

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res
      .status(200)
      .json({ message: "Password updated successfully", success: true });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

//  update details

export const updateDetails = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "User ID is required", success: false });
  }

  const { name, phone } = req.body;

  // Only include non-empty fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ error: "No fields to update", success: false });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res
      .status(200)
      .json({ message: "User details updated successfully", success: true });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};

// review

export const addReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId, stars, comment } = req.body;

    // Validate required fields
    if (!productId || !stars || !userId) {
      return res.status(400).json({
        error: "Product ID and stars are required",
        success: false,
      });
    }

    // Validate star range
    if (stars < 1 || stars > 5) {
      return res.status(400).json({
        error: "Stars must be between 1 and 5",
        success: false,
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        success: false,
      });
    }

    // Optional: Check if the user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        userId,
        productId: parseInt(productId),
      },
    });

    if (existingReview) {
      return res.status(409).json({
        error: "You have already reviewed this product",
        success: false,
      });
    }

    // Create review
    const review = await prisma.productReview.create({
      data: {
        userId,
        productId: parseInt(productId),
        stars,
        comment,
      },
    });

    res.status(201).json({
      message: "Review added successfully",
      success: true,
      review,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
    });
  }
};

// get privacy policy
export const getPrivacyPolicy = async (req, res) => {
  try {
    const privacyPolicy = await prisma.privacyPolicy.findFirst();

    if (!privacyPolicy) {
      return res.status(404).json({
        success: false,
        message: "Privacy policy not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Privacy policy fetched successfully.",
      data: privacyPolicy,
    });
  } catch (error) {
    console.error("Error fetching privacy policy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// get terms and conditions
export const getTermAndConditions = async (req, res) => {
  try {
    const terms = await prisma.termsAndConditions.findFirst();
    console.log("Fetched terms:", terms);

    return res.status(200).json({
      success: !!terms,
      message: terms
        ? "Terms and Conditions fetched successfully."
        : "Terms and Conditions not found.",
      data: terms || null,
    });
  } catch (error) {
    console.error("Error fetching Terms:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// get about us

export const getAboutUs = async (req, res) => {
  try {
    const about = await prisma.aboutUs.findFirst();
    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About Us not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "About Us fetched successfully.",
      data: about,
    });
  } catch (error) {
    console.error("Error fetching About Us:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// contact form

export const addContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required.",
      });
    }

    const contact = await prisma.contactUs.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully.",
      data: contact,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user is authenticated

    // Retrieve user details excluding sensitive information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
      success: true,
      message: "User details fetched successfully",
    });
  } catch (error) {
    console.error("Error getting user details:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};
