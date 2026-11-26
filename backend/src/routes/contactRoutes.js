import { Router } from "express";
import { contactUs } from "../controllers/contactController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.post("/", protect, contactUs);
export default router;
