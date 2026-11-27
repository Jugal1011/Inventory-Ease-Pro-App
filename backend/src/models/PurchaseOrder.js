import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: "Dealer", required: true },
    items: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, "Order must contain at least one item"],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "received",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "partial"],
      default: "paid",
    },
    orderDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ user: 1, createdAt: -1 });

purchaseOrderSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
});

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
