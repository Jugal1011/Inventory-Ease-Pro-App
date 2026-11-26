export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// At least 8 chars with upper, lower, digit and a special character.
export const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;

export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

export const isValidEmail = (email) => EMAIL_RE.test(String(email ?? ""));
export const isStrongPassword = (password) => STRONG_PASSWORD_RE.test(String(password ?? ""));
