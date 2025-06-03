import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import bcrypt from "bcrypt";
const SALT_ROUNDS = 10;
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "Aniket@1234";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7 days

// User login

// Login handler
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1️⃣ Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    // 2️⃣ Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT (payload: user ID & role)
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 4️⃣ Remove sensitive fields
    const { password: _pwd, ...userWithoutPassword } = user;

    // 5️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// User registration

export const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 1️⃣ Check existing email
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // 2️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3️⃣ Save user with hashed password
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 4️⃣ Respond
    return res
      .status(201)
      .json({ success: true, message: "Registration successful", user });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//         admin

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1️⃣ Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin does not exist" });
    }

    // 2️⃣ Validate password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT (payload: admin ID & role)
    const token = jwt.sign({ userId: admin.id, role: admin.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 4️⃣ Remove sensitive fields
    const { password: _pwd, ...adminWithoutPassword } = admin;

    // 5️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: adminWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Admin registration

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if ((!name || !email || !password, !role)) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 1️⃣ Check existing email
    const existingAdmin = await prisma.admin.findFirst({
      where: { email },
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    // 2️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    let status = "ACTIVE";
    // if (role === "VENDOR") {
    //   status = "PENDING";
    // }

    // 3️⃣ Save admin with hashed password
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status,
      },
    });

    // 4️⃣ Respond
    return res
      .status(201)
      .json({ success: true, message: "Registration successful", admin });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//      vendor

// export const vendorLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide all required fields",
//       });
//     }

//     // 1️⃣ Find vendor by email
//     const vendor = await prisma.admin.findUnique({
//       where: { email },
//     });
//     if (!vendor) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Vendor does not exist" });
//     }

//     if (vendor.status === "PENDING") {
//       return res
//         .status(401)
//         .json({ success: false, message: "Vendor is not approved yet" });
//     }

//     // 2️⃣ Validate password
//     const isPasswordValid = await bcrypt.compare(password, vendor.password);
//     if (!isPasswordValid) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid credentials" });
//     }

//     // 3️⃣ Generate JWT (payload: vendor ID & role)
//     const token = jwt.sign(
//       { userId: vendor.id, role: vendor.role },
//       JWT_SECRET,
//       {
//         expiresIn: JWT_EXPIRES_IN,
//       }
//     );

//     // 4️⃣ Remove sensitive fields
//     const { password: _pwd, ...vendorWithoutPassword } = vendor;

//     // 5️⃣ Send response
//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       vendor: vendorWithoutPassword,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
