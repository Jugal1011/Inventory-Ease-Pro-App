import Dealer from "../models/Dealer.js";
import { AppError } from "../utils/AppError.js";

const DEALER_FIELDS = ["name", "email", "phone", "company", "category", "address", "status", "notes"];
const REQUIRED_FIELDS = ["name", "email", "phone"];

function pickDealerFields(body) {
  const out = {};
  for (const key of DEALER_FIELDS) {
    if (body[key] !== undefined) {
      out[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
    }
  }
  return out;
}

async function findOwnedDealer(id, userId) {
  const dealer = await Dealer.findOne({ _id: id, user: userId });
  if (!dealer) throw new AppError("Dealer not found", 404);
  return dealer;
}

export async function createDealer(req, res) {
  const fields = pickDealerFields(req.body ?? {});
  for (const key of REQUIRED_FIELDS) {
    if (!fields[key]) throw new AppError(`Please fill in ${key}`, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  if (fields.status && !["active", "inactive"].includes(fields.status)) {
    throw new AppError("Invalid status value. Must be active or inactive", 400);
  }

  const dealer = await Dealer.create({
    ...fields,
    user: req.user._id,
  });

  res.status(201).json(dealer);
}

export async function getDealers(req, res) {
  const dealers = await Dealer.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(dealers);
}

export async function getDealer(req, res) {
  res.json(await findOwnedDealer(req.params.id, req.user._id));
}

export async function updateDealer(req, res) {
  const dealer = await findOwnedDealer(req.params.id, req.user._id);
  const updates = pickDealerFields(req.body ?? {});

  if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(updates.email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  if (updates.status && !["active", "inactive"].includes(updates.status)) {
    throw new AppError("Invalid status value. Must be active or inactive", 400);
  }

  Object.assign(dealer, updates);
  await dealer.save();

  res.json(dealer);
}

export async function deleteDealer(req, res) {
  const dealer = await findOwnedDealer(req.params.id, req.user._id);
  await dealer.deleteOne();
  res.json({ message: "Dealer deleted successfully" });
}
