import { Router } from "express";
import * as c from "../controllers/dealerController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);
router.route("/").get(c.getDealers).post(c.createDealer);
router
  .route("/:id")
  .get(c.getDealer)
  .patch(c.updateDealer)
  .put(c.updateDealer)
  .delete(c.deleteDealer);

export default router;
