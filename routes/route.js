const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { isAdmin } = require("../middleware/auth");

// Show all routes
router.get("/",isAdmin, (req, res) => {
  connection.query("SELECT * FROM route", (err, results) => {
    if (err) throw err;
    res.render("route/index", { routes: results });
  });
});

// Show add form
router.get("/add", (req, res) => {
  res.render("route/add");
});

// Insert route
router.post("/add",isAdmin, (req, res) => {
  const { Source, Destination, Distance } = req.body;

  // Step 1: Get last Route_ID
  const getLastIdQuery = "SELECT Route_ID FROM route ORDER BY Route_ID DESC LIMIT 1";

  connection.query(getLastIdQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching last Route ID");
    }

    let newId;

    if (result.length === 0) {
      newId = "R101"; // first entry
    } else {
      const lastId = result[0].Route_ID; // e.g., R101

      let numberPart = parseInt(lastId.substring(1)); // 101
      numberPart++;

      newId = "R" + numberPart; // R102
    }

    // Step 2: Insert route
    const insertQuery = `
      INSERT INTO route (Route_ID, Source, Destination, Distance)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [newId, Source, Destination, Distance],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.send("Error inserting route");
        }

        res.redirect("/route");
      }
    );
  });
});

router.get("/delete/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  connection.query(
    "DELETE FROM route WHERE Route_ID = ?",
    [id],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Error deleting route");
      }
      res.redirect("/route");
    }
  );
});

router.get("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  connection.query(
    "SELECT * FROM route WHERE Route_ID = ?",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error fetching route");
      }
      res.render("route/edit", { route: result[0] });
    }
  );
});

router.post("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;
  const { Source, Destination, Distance } = req.body;

  const sql = `
    UPDATE route
    SET Source = ?, Destination = ?, Distance = ?
    WHERE Route_ID = ?
  `;

  connection.query(sql, [Source, Destination, Distance, id], (err) => {
    if (err) {
      console.log(err);
      return res.send("Error updating route");
    }
    res.redirect("/route");
  });
});

module.exports = router;