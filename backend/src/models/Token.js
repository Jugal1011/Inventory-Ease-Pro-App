import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, index: true },
    tokenType: { type: String, required: true, enum: ["forget-password", "confirm-email"] },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB removes expired tokens automatically.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Token", tokenSchema);
