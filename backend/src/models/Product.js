import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: [true, "Please add a name"], trim: true, maxlength: 120 },
    sku: { type: String, required: true, trim: true },
    category: { type: String, required: [true, "Please add a category"], trim: true, maxlength: 60 },
    quantity: { type: Number, required: [true, "Please add a quantity"], min: [0, "Quantity cannot be negative"] },
    price: { type: Number, required: [true, "Please add a price"], min: [0, "Price cannot be negative"] },
    description: { type: String, required: [true, "Please add a description"], trim: true, maxlength: 2000 },
    image: {
      type: new mongoose.Schema(
        {
          url: { type: String, default: "" },
          publicId: { type: String, default: "" },
          fileName: { type: String, default: "" },
          fileType: { type: String, default: "" },
          fileSize: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
  },
  { timestamps: true }
);

productSchema.index({ user: 1, createdAt: -1 });

productSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.totalValue = ret.price * ret.quantity;
    return ret;
  },
});

export default mongoose.model("Product", productSchema);
