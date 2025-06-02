import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
// import helmet from "helmet";
import cors from "cors";

// Import routes
import publicRoutes from "./routes/publicRoute.js";
import webRoutes from "./routes/webRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import vendorRoutes from "./routes/vendorRoute.js";

// Import authentication middleware
import { adminAuth } from "./utils/authMiddleware.js";
import { vendorAuth } from "./utils/authMiddleware.js";

// Load environment variables
dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(helmet()); // Security headers
// app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5175",
      "http://localhost:5174",
      "http://103.189.173.127",
      "http://localhost:3001",
      "https://namosundarifrontend.vercel.app",
    ], // or your frontend URL
    credentials: true, // if you're using cookies
  })
);
// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/public", publicRoutes);
app.use("/api/web", webRoutes);
app.use("/api/admin", adminAuth, adminRoutes);
app.use("/api/vendor", vendorAuth, vendorRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server with DB connection
async function startServer() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.info("SIGINT signal received: closing HTTP server");
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.info("SIGTERM signal received: closing HTTP server");
  await prisma.$disconnect();
  process.exit(0);
});
