import mongoose from "mongoose";
import Customer from "../src/models/Customer.js";
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../src/controllers/customerController.js";
import { AppError } from "../src/utils/AppError.js";

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
};

// 1. Validation tests
const testUser = new mongoose.Types.ObjectId();

// Missing name
let c = new Customer({ user: testUser, email: "john@example.com", phone: "1234567890" });
let err = c.validateSync();
ok("Customer requires name", !err?.errors?.name === false);

// Missing email
c = new Customer({ user: testUser, name: "John Doe", phone: "1234567890" });
err = c.validateSync();
ok("Customer requires email", !err?.errors?.email === false);

// Invalid email
c = new Customer({ user: testUser, name: "John Doe", email: "invalid-email", phone: "1234567890" });
err = c.validateSync();
ok("Customer rejects invalid email", !err?.errors?.email === false);

// Missing phone
c = new Customer({ user: testUser, name: "John Doe", email: "john@example.com" });
err = c.validateSync();
ok("Customer requires phone", !err?.errors?.phone === false);

// Invalid status
c = new Customer({ user: testUser, name: "John Doe", email: "john@example.com", phone: "1234567890", status: "not_a_status" });
err = c.validateSync();
ok("Customer rejects invalid status", !err?.errors?.status === false);

// Valid customer with defaults
c = new Customer({
  user: testUser,
  name: "Acme Corp Rep",
  email: "rep@acmecorp.com",
  phone: "+1 555-0199",
  company: "Acme Corp",
  address: "123 Main St, Springfield",
  notes: "Prefers morning deliveries"
});
err = c.validateSync();
ok("Valid customer passes validation", !err);
ok("Default status is 'active'", c.status === "active");

// 2. Controller error checking tests
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

// Missing required field in controller
try {
  await createCustomer({ body: { name: "Test" }, user: { _id: testUser } }, mockRes());
  ok("createCustomer rejects missing required fields", false);
} catch (e) {
  ok("createCustomer throws AppError on missing email/phone", e instanceof AppError && e.statusCode === 400);
}

// Invalid email in controller
try {
  await createCustomer({ body: { name: "Test", email: "invalid", phone: "123" }, user: { _id: testUser } }, mockRes());
  ok("createCustomer rejects invalid email", false);
} catch (e) {
  ok("createCustomer throws AppError on invalid email", e instanceof AppError && e.statusCode === 400);
}

// Invalid status in controller
try {
  await createCustomer({ body: { name: "Test", email: "test@example.com", phone: "123", status: "bad" }, user: { _id: testUser } }, mockRes());
  ok("createCustomer rejects invalid status", false);
} catch (e) {
  ok("createCustomer throws AppError on invalid status", e instanceof AppError && e.statusCode === 400);
}

console.log(`\nCustomer tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
