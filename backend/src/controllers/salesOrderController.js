import SalesOrder from "../models/SalesOrder.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { AppError } from "../utils/AppError.js";

async function findOwnedSalesOrder(id, userId) {
  const order = await SalesOrder.findOne({ _id: id, user: userId })
    .populate("customer", "name email phone company")
    .populate("items.product", "name sku category price quantity");
  if (!order) throw new AppError("Sales order not found", 404);
  return order;
}

export async function createSalesOrder(req, res) {
  const { customer: customerId, items, status = "completed", paymentStatus = "paid", notes = "" } = req.body ?? {};

  if (!customerId) throw new AppError("Please select a customer", 400);
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("Order must contain at least one item", 400);
  }

  // Verify customer belongs to user
  const customer = await Customer.findOne({ _id: customerId, user: req.user._id });
  if (!customer) throw new AppError("Customer not found", 404);

  // Validate items and verify product ownership and stock
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
      throw new AppError("Item unit price must be 0 or more", 400);
    }

    // Check stock if status is completed
    if (status === "completed" && product.quantity < qty) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.quantity}, requested: ${qty}`,
        400
      );
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

  // Update stock in real time if status is completed
  if (status === "completed") {
    for (const { product, qty } of productsToUpdate) {
      product.quantity -= qty;
      await product.save();
    }
  }

  const orderNumber = `SO-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

  const order = await SalesOrder.create({
    user: req.user._id,
    orderNumber,
    customer: customer._id,
    items: validatedItems,
    totalAmount,
    status,
    paymentStatus,
    notes,
  });

  const populated = await SalesOrder.findById(order._id)
    .populate("customer", "name email phone company")
    .populate("items.product", "name sku category price quantity");

  res.status(201).json(populated);
}

export async function getSalesOrders(req, res) {
  const orders = await SalesOrder.find({ user: req.user._id })
    .populate("customer", "name email phone company")
    .populate("items.product", "name sku category price quantity")
    .sort({ createdAt: -1 });
  res.json(orders);
}

export async function getSalesOrder(req, res) {
  res.json(await findOwnedSalesOrder(req.params.id, req.user._id));
}

export async function updateSalesOrderStatus(req, res) {
  const order = await findOwnedSalesOrder(req.params.id, req.user._id);
  const { status, paymentStatus, notes } = req.body ?? {};

  if (status && status !== order.status) {
    if (!["pending", "completed", "cancelled"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    // Changing to completed: deduct stock
    if (status === "completed" && order.status !== "completed") {
      // Validate all stock first
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, user: req.user._id });
        if (!product) throw new AppError(`Product ${item.name} not found`, 404);
        if (product.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${product.quantity}, needed: ${item.quantity}`,
            400
          );
        }
      }
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, user: req.user._id });
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // Changing from completed to cancelled or pending: restore stock
    if (order.status === "completed" && (status === "cancelled" || status === "pending")) {
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, user: req.user._id });
        if (product) {
          product.quantity += item.quantity;
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

export async function deleteSalesOrder(req, res) {
  const order = await findOwnedSalesOrder(req.params.id, req.user._id);

  // If deleted while completed, restore stock
  if (order.status === "completed") {
    for (const item of order.items) {
      const product = await Product.findOne({ _id: item.product, user: req.user._id });
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }
  }

  await order.deleteOne();
  res.json({ message: "Sales order deleted successfully" });
}
