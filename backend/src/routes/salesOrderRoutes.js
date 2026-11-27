import { Router } from "express";
import * as c from "../controllers/salesOrderController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.route("/").get(c.getSalesOrders).post(c.createSalesOrder);
router
  .route("/:id")
  .get(c.getSalesOrder)
  .patch(c.updateSalesOrderStatus)
  .put(c.updateSalesOrderStatus)
  .delete(c.deleteSalesOrder);

export default router;
