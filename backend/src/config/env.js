const required = ["MONGO_URI", "JWT_SECRET"];

export function loadEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return {
    port: Number(process.env.PORT) || 5000,
    isProd: process.env.NODE_ENV === "production",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  };
}
