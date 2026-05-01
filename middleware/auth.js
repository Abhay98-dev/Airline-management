exports.isLoggedIn = (req, res, next) => {
  if (!req.session.user) return res.redirect("/login");
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.session.role === "admin") return next();
  return res.send("Access Denied (Admin only)");
};

exports.isUser = (req, res, next) => {
  if (req.session.role === "user") return next();
  return res.send("Access Denied (User only)");
};