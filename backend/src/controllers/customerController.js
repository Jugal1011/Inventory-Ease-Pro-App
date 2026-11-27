import Customer from "../models/Customer.js";
import { AppError } from "../utils/AppError.js";

const CUSTOMER_FIELDS = ["name", "email", "phone", "company", "address", "status", "notes"];
const REQUIRED_FIELDS = ["name", "email", "phone"];

function pickCustomerFields(body) {
  const out = {};
  for (const key of CUSTOMER_FIELDS) {
    if (body[key] !== undefined) {
      out[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
    }
  }
  return out;
}

async function findOwnedCustomer(id, userId) {
  const customer = await Customer.findOne({ _id: id, user: userId });
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
}

export async function createCustomer(req, res) {
  const fields = pickCustomerFields(req.body ?? {});
  for (const key of REQUIRED_FIELDS) {
    if (!fields[key]) throw new AppError(`Please fill in ${key}`, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  if (fields.status && !["active", "inactive", "lead"].includes(fields.status)) {
    throw new AppError("Invalid status. Must be active, inactive, or lead", 400);
  }

  const customer = await Customer.create({
    ...fields,
    user: req.user._id,
  });

  res.status(201).json(customer);
}

export async function getCustomers(req, res) {
  const customers = await Customer.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(customers);
}

export async function getCustomer(req, res) {
  res.json(await findOwnedCustomer(req.params.id, req.user._id));
}

export async function updateCustomer(req, res) {
  const customer = await findOwnedCustomer(req.params.id, req.user._id);
  const updates = pickCustomerFields(req.body ?? {});

  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(updates.email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  if (updates.status && !["active", "inactive", "lead"].includes(updates.status)) {
    throw new AppError("Invalid status. Must be active, inactive, or lead", 400);
  }

  Object.assign(customer, updates);
  await customer.save();

  res.json(customer);
}

export async function deleteCustomer(req, res) {
  const customer = await findOwnedCustomer(req.params.id, req.user._id);
  await customer.deleteOne();
  res.json({ message: "Customer deleted successfully" });
}
