import { Router } from "express";
import * as c from "../controllers/productController.js";
import { protect } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";

const router = Router();

router.use(protect);
router.route("/").get(c.getProducts).post(imageUpload.single("image"), c.createProduct);
router.route("/:id").get(c.getProduct).patch(imageUpload.single("image"), c.updateProduct).delete(c.deleteProduct);

export default router;
