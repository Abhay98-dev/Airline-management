const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth");

router.get("/", isAdmin, (req, res) => {
  res.render("admin/dashboard");
});

module.exports = router;