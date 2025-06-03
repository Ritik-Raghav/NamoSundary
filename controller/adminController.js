import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import slugify from "slugify";

const prisma = new PrismaClient();

export const getAllUsers = async (req, res) => {
  //   console.log(req.user);
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get user by id

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        Address: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// update user password

export const updateUserPassword = async (req, res) => {
  const { id, password } = req.body;
  try {
    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields",
      });
    }

    //password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        password: hashedPassword,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get all vendors

// export const getAllVendors = async (req, res) => {
//   try {
//     const vendors = await prisma.admin.findMany({
//       where: {
//         role: "VENDOR",
//         status: "ACTIVE",
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "All vendors fetched successfully",
//       vendors,
//     });
//   } catch (error) {
//     console.error("Error fetching vendors:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// get all pending vendors
// export const getAllPendingVendors = async (req, res) => {
//   try {
//     const vendors = await prisma.admin.findMany({
//       where: {
//         role: "VENDOR",
//         status: "PENDING",
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "All vendors fetched successfully",
//       vendors,
//     });
//   } catch (error) {
//     console.error("Error fetching vendors:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// get vendor by id

// export const getVendorById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const vendor = await prisma.admin.findUnique({
//       where: {
//         id: Number(id),
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     if (!vendor) {
//       return res.status(404).json({
//         success: false,
//         message: "Vendor not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Vendor fetched successfully",
//       vendor,
//     });
//   } catch (error) {
//     console.error("Error fetching vendor:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// update vendor password

// export const updateVendorPassword = async (req, res) => {
//   const { id, password } = req.body;
//   try {
//     if (!id || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide all fields",
//       });
//     }

//     //password hashing
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const vendor = await prisma.admin.update({
//       where: {
//         id: Number(id),
//       },
//       data: {
//         password: hashedPassword,
//       },
//     });

//     if (!vendor) {
//       return res.status(404).json({
//         success: false,
//         message: "Vendor not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Password updated successfully",
//       vendor,
//     });
//   } catch (error) {
//     console.error("Error updating password:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// update vendor status

// export const updateVendorStatus = async (req, res) => {
//   const { id } = req.body;
//   try {
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide all fields",
//       });
//     }

//     const vendor = await prisma.admin.update({
//       where: {
//         id: Number(id),
//       },
//       data: {
//         status: "ACTIVE",
//       },
//     });

//     if (!vendor) {
//       return res.status(404).json({
//         success: false,
//         message: "Vendor not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Vendor status updated successfully",
//       vendor,
//     });
//   } catch (error) {
//     console.error("Error updating status:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// add banner

export const addBanner = async (req, res) => {
  try {
    const { title, description, catId, subCatId, type } = req.body;
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;

    console.log(req.body);
    console.log(imgUrl);

    if (!title || !imgUrl || !type) {
      return res.status(400).json({
        success: false,
        message: "Title, type, and image are required.",
      });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        description: description || null,
        catId: catId ? parseInt(catId) : null,
        subCatId: subCatId ? parseInt(subCatId) : null,
        type,
        imgUrl,
        status: 1, // default status
      },
    });

    res.status(201).json({
      success: true,
      message: "Banner added successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error adding banner:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// get all banners

export const getAllBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// delete banner by id

export const deleteBannerById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
    }
    const banner = await prisma.banner.delete({
      where: {
        id: Number(id),
      },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// update banner by id

export const updateBannerById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Valid banner ID is required",
    });
  }

  try {
    // Build dynamic update payload
    const updateData = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.catId !== undefined)
      updateData.catId = Number(req.body.catId) || null;
    if (req.body.subCatId !== undefined)
      updateData.subCatId = Number(req.body.subCatId) || null;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.file) updateData.imgUrl = `/uploads/${req.file.filename}`;

    const updatedBanner = await prisma.banner.update({
      where: {
        id: Number(id),
      },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);

    // Prisma error for record not found
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// get all banners for web

export const getAllBannersWeb = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        status: 1,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// set settings
export const setSettings = async (req, res) => {
  try {
    const { plateformfee, gst, deliveryFee } = req.body;

    // Prepare only the provided fields
    const updateData = {};
    // if (vendorCommission !== undefined)
    //   updateData.vendorCommission = parseInt(vendorCommission);
    if (plateformfee !== undefined)
      updateData.plateformfee = parseInt(plateformfee);
    if (gst !== undefined) updateData.gst = parseInt(gst);
    if (deliveryFee !== undefined)
      updateData.deliveryFee = parseInt(deliveryFee);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update.",
      });
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        // vendorCommission: parseInt(vendorCommission ?? 0),
        plateformfee: parseInt(plateformfee ?? 0),
        gst: parseInt(gst ?? 0),
        deliveryFee: parseInt(deliveryFee ?? 0),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error in setSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get settings

export const getSettings = async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error in getSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get all transactions

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.payment.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// add privacy policy

export const createOrUpdatePrivacyPolicy = async (req, res) => {
  try {
    const { title, description } = req.body;
    const newImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.privacyPolicy.findFirst();

    let privacyPolicy;

    if (existing) {
      privacyPolicy = await prisma.privacyPolicy.update({
        where: { id: existing.id },
        data: {
          title,
          description,
          slug,
          ...(newImage ? { image: newImage } : {}), // update image only if new image provided
        },
      });
    } else {
      privacyPolicy = await prisma.privacyPolicy.create({
        data: {
          title,
          description,
          slug,
          image: newImage || null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: existing
        ? "Privacy policy updated successfully."
        : "Privacy policy created successfully.",
      data: privacyPolicy,
    });
  } catch (error) {
    console.error("Error in createOrUpdatePrivacyPolicy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
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

// create or update terms and conditions
export const createOrUpdateTerms = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.termsAndConditions.findFirst();

    const terms = existing
      ? await prisma.termsAndConditions.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            slug,
            ...(image ? { image } : {}),
          },
        })
      : await prisma.termsAndConditions.create({
          data: {
            title,
            description,
            slug,
            image: image || null,
          },
        });

    return res.status(200).json({
      success: true,
      message: existing
        ? "Terms and Conditions updated."
        : "Terms and Conditions created.",
      data: terms,
    });
  } catch (error) {
    console.error("Error creating/updating Terms:", error);
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

// create or update about us

export const createOrUpdateAbout = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required.",
      });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.aboutUs.findFirst();

    const about = existing
      ? await prisma.aboutUs.update({
          where: { id: existing.id },
          data: {
            title,
            description,
            slug,
            ...(image ? { image } : {}),
          },
        })
      : await prisma.aboutUs.create({
          data: {
            title,
            description,
            slug,
            image: image || null,
          },
        });

    return res.status(200).json({
      success: true,
      message: existing ? "About Us updated." : "About Us created.",
      data: about,
    });
  } catch (error) {
    console.error("Error creating/updating About Us:", error);
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

// get contact us query

export const getContectUsQuery = async (req, res) => {
  try {
    const queries = await prisma.contactUs.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All queries fetched successfully",
      data: queries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
