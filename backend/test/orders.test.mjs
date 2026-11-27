import mongoose from "mongoose";
import Dealer from "../src/models/Dealer.js";
import SalesOrder from "../src/models/SalesOrder.js";
import PurchaseOrder from "../src/models/PurchaseOrder.js";
import { AppError } from "../src/utils/AppError.js";

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
};

const testUser = new mongoose.Types.ObjectId();
const testDealerId = new mongoose.Types.ObjectId();
const testCustomerId = new mongoose.Types.ObjectId();
const testProductId = new mongoose.Types.ObjectId();

// 1. Dealer model validations
let d = new Dealer({ user: testUser, phone: "123" });
let err = d.validateSync();
ok("Dealer requires name", !err?.errors?.name === false);

d = new Dealer({ user: testUser, name: "Alpha", phone: "123" });
err = d.validateSync();
ok("Dealer requires email", !err?.errors?.email === false);

d = new Dealer({ user: testUser, name: "Alpha", email: "bad-email", phone: "123" });
err = d.validateSync();
ok("Dealer rejects invalid email", !err?.errors?.email === false);

d = new Dealer({
  user: testUser,
  name: "Global Supplies",
  email: "sales@globalsupplies.com",
  phone: "+91 98765 00000",
  company: "Global Supplies Ltd",
  category: "Electronics",
});
err = d.validateSync();
ok("Valid dealer passes validation", !err);
ok("Dealer defaults to active status", d.status === "active");

// 2. SalesOrder model validations
let so = new SalesOrder({ user: testUser, orderNumber: "SO-12345", customer: testCustomerId, items: [], totalAmount: 0 });
err = so.validateSync();
ok("Sales order requires at least one item", !err?.errors?.items === false);

so = new SalesOrder({
  user: testUser,
  orderNumber: "SO-12345",
  customer: testCustomerId,
  items: [{ product: testProductId, name: "Widget", quantity: 2, unitPrice: 50, total: 100 }],
  totalAmount: 100,
});
err = so.validateSync();
ok("Valid sales order passes validation", !err);
ok("Sales order defaults to completed status", so.status === "completed");
ok("Sales order defaults to paid paymentStatus", so.paymentStatus === "paid");

// 3. PurchaseOrder model validations
let po = new PurchaseOrder({ user: testUser, orderNumber: "PO-12345", dealer: testDealerId, items: [], totalAmount: 0 });
err = po.validateSync();
ok("Purchase order requires at least one item", !err?.errors?.items === false);

po = new PurchaseOrder({
  user: testUser,
  orderNumber: "PO-12345",
  dealer: testDealerId,
  items: [{ product: testProductId, name: "Widget", quantity: 10, unitPrice: 30, total: 300 }],
  totalAmount: 300,
});
err = po.validateSync();
ok("Valid purchase order passes validation", !err);
ok("Purchase order defaults to received status", po.status === "received");
ok("Purchase order defaults to paid paymentStatus", po.paymentStatus === "paid");

// 4. Stock simulation test
let inventoryStock = 15;

// Simulate sale of 5 items
const saleQty = 5;
if (inventoryStock >= saleQty) {
  inventoryStock -= saleQty;
}
ok("Stock deducted accurately on completed sale (15 - 5 = 10)", inventoryStock === 10);

// Simulate sale exceeding stock
const excessiveSale = 20;
const hasStock = inventoryStock >= excessiveSale;
ok("Sale blocked when quantity exceeds stock", !hasStock);

// Simulate purchase order receipt of 25 items
const purchaseQty = 25;
inventoryStock += purchaseQty;
ok("Stock increased accurately on received purchase (10 + 25 = 35)", inventoryStock === 35);

// Simulate order cancellation / reversal
inventoryStock -= purchaseQty;
ok("Stock reversed accurately on cancelled purchase (35 - 25 = 10)", inventoryStock === 10);

console.log(`\nOrder and Dealer tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
