console.log("SERVER FILE IS RUNNING");

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

// =====================
// ENV
// =====================
dotenv.config({ path: path.resolve(__dirname, ".env") });

// =====================
// IMPORT ROUTES
// =====================
const healthRoutes = require("./routes/healthRoutes");
const queueRoutes = require("./routes/queueRoutes");
const authRoutes = require("./routes/authRoutes");

// =====================
// APP SETUP
// =====================
const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// =====================
// ALLOWED ORIGINS
// =====================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "https://uni-queue-system.vercel.app",
  "https://uniqueuesea.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("❌ CORS blocked origin:", origin);
    return callback(null, false);
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: false,
  optionsSuccessStatus: 204,
};

// =====================
// SOCKET.IO
// =====================
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: false,
  },
  path: "/socket.io",
});

app.set("io", io);

// =====================
// DEBUG
// =====================
console.log("ENV CHECK:", {
  MONGODB_URI: MONGODB_URI ? "OK" : "MISSING",
  PORT,
});

// =====================
// MIDDLEWARE
// =====================
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// ROUTES
// =====================
app.use("/api", healthRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "UniQueue API",
    time: new Date().toISOString(),
  });
});

// =====================
// SOCKET
// =====================
io.on("connection", (socket) => {
  socket.emit("connected", {
    message: "UniQueue connected",
    timestamp: new Date().toISOString(),
  });
});

// =====================
// ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);

  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// =====================
// DATABASE
// =====================
async function connectDatabase() {
  if (!MONGODB_URI) {
    console.warn("⚠️ No MongoDB URI — skipping DB connection");
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.warn("MongoDB error (non-blocking):", err.message);
  }
}

// =====================
// START SERVER
// =====================
async function startServer() {
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ SERVER RUNNING: http://localhost:${PORT}`);
    console.log(`   HEALTH: http://localhost:${PORT}/api/health`);
  });

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ PORT ${PORT} already in use`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  connectDatabase();
}

startServer();