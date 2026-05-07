const path = require("path");

const envPath = path.resolve(__dirname, ".env");
const dotenvResult = require("dotenv").config({ path: envPath, quiet: true });

if (dotenvResult.error) {
  console.warn(`Could not load environment file at ${envPath}`);
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const healthRoutes = require("./routes/healthRoutes");
const queueRoutes = require("./routes/queueRoutes");
const QueueCounter = require("./models/QueueCounter");
const QueueTicket = require("./models/QueueTicket");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = CORS_ORIGIN.split(",").map((origin) => origin.trim());
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

console.log("ENV CHECK:", {
  MONGODB_URI: MONGODB_URI ? "OK" : "MISSING",
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRoutes);
app.use("/api/queues", queueRoutes);

io.on("connection", (socket) => {
  socket.emit("queues:connected", {
    message: "Connected to UniQueue real-time updates",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource ID" });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate value already exists" });
  }

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
  await prepareQueueCollections();
  console.log("MongoDB connected");
}

async function prepareQueueCollections() {
  await QueueCounter.init();
  await QueueTicket.init();

  const indexes = await QueueTicket.collection.indexes();
  const legacyQueueNumberIndex = indexes.find(
    (index) => index.name === "queueNumber_1" && index.unique
  );

  if (legacyQueueNumberIndex) {
    await QueueTicket.collection.dropIndex("queueNumber_1");
    console.log("Dropped legacy global queueNumber index");
  }

  await syncTodayQueueCounters();
}

async function syncTodayQueueCounters() {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  await Promise.all(
    ["consultation", "documentation"].map(async (serviceType) => {
      const latestTicket = await QueueTicket.findOne({ dateKey, serviceType })
        .sort({ queueNumber: -1 })
        .lean();
      const sequence = latestTicket ? Number(latestTicket.queueNumber.split("-")[1]) || 0 : 0;

      await QueueCounter.findOneAndUpdate(
        { dateKey, serviceType },
        { $set: { sequence } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    })
  );
}

async function startServer() {
  try {
    await connectDatabase();

    httpServer.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

