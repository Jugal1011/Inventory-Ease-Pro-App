import PurchaseOrder from "../models/PurchaseOrder.js";
import Product from "../models/Product.js";
import Dealer from "../models/Dealer.js";
import { AppError } from "../utils/AppError.js";

async function findOwnedPurchaseOrder(id, userId) {
  const order = await PurchaseOrder.findOne({ _id: id, user: userId })
    .populate("dealer", "name email phone company category")
    .populate("items.product", "name sku category price quantity");
  if (!order) throw new AppError("Purchase order not found", 404);
  return order;
}

export async function createPurchaseOrder(req, res) {
  const { dealer: dealerId, items, status = "received", paymentStatus = "paid", notes = "" } = req.body ?? {};

  if (!dealerId) throw new AppError("Please select a dealer", 400);
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must contain at least one item", 400);
  }

  // Verify dealer belongs to user
  const dealer = await Dealer.findOne({ _id: dealerId, user: req.user._id });
  if (!dealer) throw new AppError("Dealer not found", 404);

  const validatedItems = [];
  let totalAmount = 0;
  const productsToUpdate = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!item.product || isNaN(qty) || qty <= 0) {
      throw new AppError("Each item must have a valid product and quantity of 1 or more", 400);
    }

    const product = await Product.findOne({ _id: item.product, user: req.user._id });
    if (!product) throw new AppError(`Product not found: ${item.name || item.product}`, 404);

    const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;
    if (isNaN(unitPrice) || unitPrice < 0) {
      throw new AppError("Item unit cost must be 0 or more", 400);
    }

    const lineTotal = unitPrice * qty;
    totalAmount += lineTotal;

    validatedItems.push({
      product: product._id,
      name: product.name,
      quantity: qty,
      unitPrice,
      total: lineTotal,
    });

    productsToUpdate.push({ product, qty });
  }

  // Update inventory stock in real time if status is received
  if (status === "received") {
    for (const { product, qty } of productsToUpdate) {
      product.quantity += qty;
      await product.save();
    }
  }

  const orderNumber = `PO-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

  const order = await PurchaseOrder.create({
    user: req.user._id,
    orderNumber,
    dealer: dealer._id,
    items: validatedItems,
    totalAmount,
    status,
    paymentStatus,
    notes,
  });

  const populated = await PurchaseOrder.findById(order._id)
    .populate("dealer", "name email phone company category")
    .populate("items.product", "name sku category price quantity");

  res.status(201).json(populated);
}

export async function getPurchaseOrders(req, res) {
  const orders = await PurchaseOrder.find({ user: req.user._id })
    .populate("dealer", "name email phone company category")
    .populate("items.product", "name sku category price quantity")
    .sort({ createdAt: -1 });
  res.json(orders);
}

export async function getPurchaseOrder(req, res) {
  res.json(await findOwnedPurchaseOrder(req.params.id, req.user._id));
}

export async function updatePurchaseOrderStatus(req, res) {
  const order = await findOwnedPurchaseOrder(req.params.id, req.user._id);
  const { status, paymentStatus, notes } = req.body ?? {};

  if (status && status !== order.status) {
    if (!["pending", "received", "cancelled"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    // Changing to received: add stock
    if (status === "received" && order.status !== "received") {
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, user: req.user._id });
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Changing from received to cancelled or pending: deduct stock
    if (order.status === "received" && (status === "cancelled" || status === "pending")) {
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, user: req.user._id });
        if (product) {
          product.quantity = Math.max(0, product.quantity - item.quantity);
          await product.save();
        }
      }
    }

    order.status = status;
  }

  if (paymentStatus && ["paid", "unpaid", "partial"].includes(paymentStatus)) {
    order.paymentStatus = paymentStatus;
  }
  if (notes !== undefined) {
    order.notes = typeof notes === "string" ? notes.trim() : notes;
  }

  await order.save();
  res.json(order);
}

export async function deletePurchaseOrder(req, res) {
  const order = await findOwnedPurchaseOrder(req.params.id, req.user._id);

  // If deleted while received, deduct stock
  if (order.status === "received") {
    for (const item of order.items) {
      const product = await Product.findOne({ _id: item.product, user: req.user._id });
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
      }
    }
  }

  await order.deleteOne();
  res.json({ message: "Purchase order deleted successfully" });
}
