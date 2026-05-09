console.log("AUTH ROUTES LOADED");

const express = require("express");
const router = express.Router();

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  console.log("LOGIN ROUTE HIT");

  try {
    const { studentId, password } = req.body;

    console.log("LOGIN ATTEMPT:", studentId, password);

    // HARDCODED ADMIN
    if (studentId === "admin" && password === "admin123") {
      return res.json({
        message: "Login successful",
        user: {
          studentId: "admin",
          role: "admin",
          name: "Clinic Admin",
        },
      });
    }

    // HARDCODED STUDENT
    if (studentId === "20146338" && password === "123456") {
      return res.json({
        message: "Login successful",
        user: {
          studentId: "20146338",
          role: "student",
          name: "Test Student",
        },
      });
    }

    // INVALID LOGIN
    return res.status(400).json({
      message: "Invalid credentials",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;