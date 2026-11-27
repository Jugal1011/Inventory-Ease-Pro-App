import { Router } from "express";
import * as c from "../controllers/customerController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.route("/").get(c.getCustomers).post(c.createCustomer);
router
  .route("/:id")
  .get(c.getCustomer)
  .patch(c.updateCustomer)
  .put(c.updateCustomer)
  .delete(c.deleteCustomer);

export default router;
