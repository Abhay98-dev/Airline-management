const express = require("express");
const router = express.Router();
const { isUser } = require("../middleware/auth");

router.get("/", isUser, (req, res) => {
  res.render("user/dashboard");
});

module.exports = router;