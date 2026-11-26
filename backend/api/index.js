// Serverless entry point (Vercel). Local development uses src/server.js instead.
import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "../src/createApp.js";
import { connectDB } from "../src/config/db.js";

const app = createApp({ frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173" });

// Reuse one connection across warm invocations; retry if the previous attempt failed.
let connecting = null;
async function ensureDatabase() {
    if (mongoose.connection.readyState === 1) return;
    connecting ??= connectDB(process.env.MONGO_URI).catch((err) => {
        connecting = null;
        throw err;
    });
    await connecting;
}

export default async function handler(req, res) {
    try {
        if (!req.url.startsWith("/api/health")) await ensureDatabase();
    } catch (err) {
        console.error("Database connection failed:", err.message);
        res.statusCode = 503;
        res.setHeader("content-type", "application/json");
        return res.end(JSON.stringify({ message: "Database unavailable, please try again shortly" }));
    }
    return app(req, res);
}