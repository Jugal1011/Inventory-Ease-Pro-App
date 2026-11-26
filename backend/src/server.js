import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { verifyMailer } from "./utils/mailer.js";

const env = loadEnv();
const app = createApp({ frontendUrl: env.frontendUrl });

process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

await connectDB(process.env.MONGO_URI);
app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
// Non-blocking: a mail problem is logged, it does not stop the API.
verifyMailer();
