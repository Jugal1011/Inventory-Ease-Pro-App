import Product from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

const PRODUCT_FIELDS = ["name", "category", "quantity", "price", "description"];

function pickFields(body) {
  const out = {};
  for (const key of PRODUCT_FIELDS) {
    if (body[key] !== undefined && body[key] !== "") out[key] = body[key];
  }
  return out;
}

// Products belong to one user, so every lookup is scoped to the owner.
async function findOwnedProduct(id, userId) {
  const product = await Product.findOne({ _id: id, user: userId });
  if (!product) throw new AppError("Product not found", 404);
  return product;
}

async function imageDataFrom(file) {
  const uploaded = await uploadImage(file.buffer, "Inventory App");
  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
}

export async function createProduct(req, res) {
  const fields = pickFields(req.body ?? {});
  for (const key of PRODUCT_FIELDS) {
    if (fields[key] === undefined) throw new AppError("Please fill in all fields", 400);
  }

  const sku = `${String(fields.category).slice(0, 3).toUpperCase()}-${Date.now()}`;
  const image = req.file ? await imageDataFrom(req.file) : undefined;

  const product = await Product.create({ ...fields, sku, user: req.user._id, ...(image && { image }) });
  res.status(201).json(product);
}

export async function getProducts(req, res) {
  const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(products);
}

export async function getProduct(req, res) {
  res.json(await findOwnedProduct(req.params.id, req.user._id));
}

export async function updateProduct(req, res) {
  const product = await findOwnedProduct(req.params.id, req.user._id);
  Object.assign(product, pickFields(req.body ?? {}));

  if (req.file) {
    const oldPublicId = product.image?.publicId;
    product.image = await imageDataFrom(req.file);
    await product.save();
    // Remove the old image only after the new one is saved.
    await deleteImage(oldPublicId).catch((err) => console.error("Old image cleanup failed:", err.message));
  } else {
    await product.save();
  }

  res.json(product);
}

export async function deleteProduct(req, res) {
  const product = await findOwnedProduct(req.params.id, req.user._id);
  const publicId = product.image?.publicId;
  await product.deleteOne();
  await deleteImage(publicId).catch((err) => console.error("Image delete failed:", err.message));
  res.json({ message: "Product deleted" });
}
