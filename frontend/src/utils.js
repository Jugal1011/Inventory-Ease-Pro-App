const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

export const formatINR = (value) => inr.format(Number(value) || 0);
export const formatNumber = (value) => num.format(Number(value) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const stockStatus = (quantity) => {
  if (quantity === 0) return { label: "Out of stock", tone: "danger" };
  if (quantity <= 5) return { label: "Low stock", tone: "warning" };
  return { label: "In stock", tone: "success" };
};

export const customerStatus = (status = "active") => {
  switch (status) {
    case "active":
      return { label: "Active", tone: "success" };
    case "lead":
      return { label: "Lead", tone: "warning" };
    case "inactive":
      return { label: "Inactive", tone: "danger" };
    default:
      return { label: status, tone: "info" };
  }
};

export const orderStatusBadge = (status = "pending") => {
  switch (status) {
    case "completed":
    case "received":
      return { label: status === "completed" ? "Completed" : "Received", tone: "success" };
    case "pending":
      return { label: "Pending", tone: "warning" };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
    default:
      return { label: status, tone: "info" };
  }
};

export const paymentStatusBadge = (status = "paid") => {
  switch (status) {
    case "paid":
      return { label: "Paid", tone: "success" };
    case "partial":
      return { label: "Partial", tone: "warning" };
    case "unpaid":
      return { label: "Unpaid", tone: "danger" };
    default:
      return { label: status, tone: "info" };
  }
};

export const shorten = (text = "", max = 24) => (text.length <= max ? text : `${text.slice(0, max)}…`);

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export const PASSWORD_RULE =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character.";
export const isStrongPassword = (pw) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/.test(pw);
