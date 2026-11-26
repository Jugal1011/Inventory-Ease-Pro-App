import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { EMAIL_RE } from "../utils/validators.js";

const DEFAULT_AVATAR = "https://i.ibb.co/4pDNDk1/avatar.png";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please add a name"], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_RE, "Please enter a valid email"],
    },
    password: { type: String, required: true, select: false },
    photo: { type: String, default: DEFAULT_AVATAR },
    phone: { type: String, default: "+91", trim: true, maxlength: 20 },
    bio: { type: String, default: "", maxlength: [250, "Bio must not be more than 250 characters"] },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    photo: this.photo,
    phone: this.phone,
    bio: this.bio,
    verified: this.verified,
  };
};

export default mongoose.model("User", userSchema);
