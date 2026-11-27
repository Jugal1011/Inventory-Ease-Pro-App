import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: [true, "Please add a name"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "Please add an email"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address"],
    },
    phone: { type: String, required: [true, "Please add a phone number"], trim: true, maxlength: 30 },
    company: { type: String, trim: true, default: "", maxlength: 120 },
    address: { type: String, trim: true, default: "", maxlength: 300 },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "lead"],
        message: "Status must be active, inactive, or lead",
      },
      default: "active",
    },
    notes: { type: String, trim: true, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

customerSchema.index({ user: 1, createdAt: -1 });

customerSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
});

export default mongoose.model("Customer", customerSchema);
