console.log("AUTH ROUTES LOADED");

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  console.log("LOGIN ROUTE HIT");

  try {
    const { studentId, password } = req.body;

    console.log("LOGIN ATTEMPT:", studentId);

    // Find user by studentId
    const user = await User.findOne({ studentId });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Check password (plain text for demo)
    if (user.password !== password) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Successful login
    return res.json({
      message: "Login successful",
      user: {
        studentId: user.studentId,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// TEMPORARY SEED ROUTE - REMOVE AFTER DEMO
router.post("/seed", async (req, res) => {
  try {
    // Demo users
    const demoUsers = [
      {
        name: "Clinic Admin",
        studentId: "admin",
        password: "admin123",
        role: "admin",
      },
      {
        name: "Test Student",
        studentId: "20146338",
        password: "123456",
        role: "student",
      },
    ];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ studentId: userData.studentId });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Seeded user: ${userData.studentId}`);
      }
    }

    res.json({ message: "Demo users seeded successfully" });
  } catch (err) {
    console.error("SEED ERROR:", err);
    res.status(500).json({ message: "Seeding failed" });
  }
});

module.exports = router;