const express = require("express");
const router = express.Router();
const db = require("../config/db");

// =======================
// GET: Login Page
// =======================
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// =======================
// GET: Register Page
// =======================
router.get("/register", (req, res) => {
  res.render("auth/register");
});

// =======================
// POST: Register User
// =======================
router.post("/register", (req, res) => {
  const { Name, Email, Password } = req.body;

  const sql = "INSERT INTO users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)";

  db.query(sql, [Name, Email, Password, "user"], (err) => {
    if (err) {
      console.log(err);
      return res.send("Error registering user");
    }

    res.redirect("/login");
  });
});

// =======================
// POST: Login
// =======================
router.post("/login", (req, res) => {
  const { Email, Password } = req.body;

  const sql = "SELECT * FROM users WHERE Email = ? AND Password = ?";

  db.query(sql, [Email, Password], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Server error");
    }

    if (result.length === 0) {
      return res.send("Invalid credentials");
    }

    const user = result[0];

    // Store session data
    req.session.user = user;
    req.session.userId = user.User_ID;
    req.session.role = user.Role;   // 🔥 ROLE FROM DB

    // Redirect based on role
    if (user.Role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/user");
    }
  });
});

// =======================
// GET: Logout
// =======================
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;