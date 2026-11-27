import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import salesOrderRoutes from "./routes/salesOrderRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp({ frontendUrl }) {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(cors({ origin: frontendUrl, credentials: true }));

  app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/dealers", dealerRoutes);
  app.use("/api/sales-orders", salesOrderRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/contactus", contactRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
