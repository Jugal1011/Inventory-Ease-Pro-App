import { Router } from "express";
import * as c from "../controllers/purchaseOrderController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.route("/").get(c.getPurchaseOrders).post(c.createPurchaseOrder);
router
  .route("/:id")
  .get(c.getPurchaseOrder)
  .patch(c.updatePurchaseOrderStatus)
  .put(c.updatePurchaseOrderStatus)
  .delete(c.deletePurchaseOrder);

export default router;
