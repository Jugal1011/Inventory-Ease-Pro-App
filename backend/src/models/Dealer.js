import mongoose from "mongoose";

const dealerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: [true, "Please add a dealer name"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "Please add an email"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address"],
    },
    phone: { type: String, required: [true, "Please add a phone number"], trim: true, maxlength: 30 },
    company: { type: String, trim: true, default: "", maxlength: 120 },
    category: { type: String, trim: true, default: "General", maxlength: 80 },
    address: { type: String, trim: true, default: "", maxlength: 300 },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

dealerSchema.index({ user: 1, createdAt: -1 });

dealerSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
});

export default mongoose.model("Dealer", dealerSchema);
