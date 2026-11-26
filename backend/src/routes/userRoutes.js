import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as c from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";

const router = Router();

// Brute-force protection for credential-based endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in 15 minutes." },
});

router.post("/register", authLimiter, c.register);
router.post("/login", authLimiter, c.login);
router.get("/logout", c.logout);
router.get("/loggedin", c.loginStatus);
router.get("/getuser", protect, c.getMe);
router.patch("/updateuser", protect, imageUpload.single("photo"), c.updateUser);
router.patch("/changepassword", protect, c.changePassword);
router.post("/forgotpassword", authLimiter, c.forgotPassword);
router.put("/resetpassword/:resetToken", authLimiter, c.resetPassword);
router.put("/confirmEmail/:confirmEmailToken", c.confirmEmail);

export default router;
