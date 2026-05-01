const express = require("express");
const app = express();
const aircraftRoute=require("./routes/aircraftRoute")
const flightRoute = require("./routes/flightRoute")
const route = require("./routes/route")
const bookingRoute = require("./routes/booking")
const authRoute = require("./routes/auth")
const adminRoute = require("./routes/admin");
const userRoute = require("./routes/user");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// import DB (this will trigger connection)
require("./config/db");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(expressLayouts);

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");   // not logged in
  }

  if (req.session.role === "admin") {
    return res.redirect("/admin");   // admin dashboard
  } else {
    return res.redirect("/user");    // user dashboard
  }
});
app.use("/aircraft",aircraftRoute)
app.use("/flight",flightRoute)
app.use("/route",route)
app.use("/booking",bookingRoute)
app.use("/",authRoute)
app.use("/admin", adminRoute);
app.use("/user", userRoute);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});