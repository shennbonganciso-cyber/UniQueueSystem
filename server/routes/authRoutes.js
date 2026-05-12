const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const studentId = String(req.body.studentId ?? "").trim();
    const password = String(req.body.password ?? "").trim();

    console.log("LOGIN ATTEMPT:", studentId, password);

    if (!studentId || !password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await User.findOne({ studentId }).lean();

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user: {
        studentId: user.studentId,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/seed", async (req, res) => {
  try {
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
      }
    }

    return res.json({ message: "Demo users seeded successfully" });
  } catch (error) {
    console.error("SEED ERROR:", error);
    return res.status(500).json({ message: "Seeding failed" });
  }
});

module.exports = router;
