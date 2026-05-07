const path = require("path");

const envPath = path.resolve(__dirname, ".env");
const dotenvResult = require("dotenv").config({ path: envPath, quiet: true });

if (dotenvResult.error) {
  console.warn(`Could not load environment file at ${envPath}`);
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

console.log("ENV CHECK:", {
  MONGODB_URI: MONGODB_URI ? "OK" : "MISSING",
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

async function connectDatabase() {
  console.log("Connecting to MongoDB...");

  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is missing");
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

