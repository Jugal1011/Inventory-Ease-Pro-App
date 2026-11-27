import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./createApp.js";

const env = loadEnv();
await connectDB(process.env.MONGO_URI);

const app = createApp({ frontendUrl: env.frontendUrl });

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
