const express = require("express");
const router = express.Router();
const connection = require("../config/db");
const { isAdmin } = require("../middleware/auth");

router.get("/",isAdmin, (req, res) => {
  const sql = `
    SELECT f.*, a.Model, r.Source, r.Destination
    FROM flight f
    JOIN aircraft a ON f.Aircraft_ID = a.Aircraft_ID
    JOIN route r ON f.Route_ID = r.Route_ID
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching flights");
    }
    res.render("flight/index", { flights: results });
  });
});

router.get("/add",isAdmin, (req, res) => {

  // Step 1: get aircraft
  connection.query("SELECT * FROM aircraft", (err, aircraftResults) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching aircraft");
    }

    // Step 2: get routes
    connection.query("SELECT * FROM route", (err, routeResults) => {
      if (err) {
        console.log(err);
        return res.send("Error fetching routes");
      }

      // Step 3: render page
      res.render("flight/add", {
        aircrafts: aircraftResults,
        routes: routeResults
      });

    });

  });

});

router.post("/add",isAdmin, (req, res) => {
  const { Aircraft_ID, Route_ID, Date, Time, Status, Available_seats } = req.body;

  // Step 1: Get last Flight_ID
  const getLastIdQuery = "SELECT Flight_ID FROM flight ORDER BY Flight_ID DESC LIMIT 1";

  connection.query(getLastIdQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching last Flight ID");
    }

    let newId;

    if (result.length === 0) {
      newId = "F101"; // first entry
    } else {
      let lastId = result[0].Flight_ID; // e.g., F101

      let numberPart = parseInt(lastId.substring(1)); // 101
      numberPart++;

      newId = "F" + numberPart; // F102
    }

    // Step 2: Insert flight
    const insertQuery = `
      INSERT INTO flight 
      (Flight_ID, Aircraft_ID, Route_ID, Date, Time, Status, Available_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [newId, Aircraft_ID, Route_ID, Date, Time, Status, Available_seats],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.send("Error inserting flight");
        }

        res.redirect("/flight"); // better UX
      }
    );
  });
});

router.get("/delete/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  connection.query(
    "DELETE FROM flight WHERE Flight_ID = ?",
    [id],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Error deleting flight");
      }
      res.redirect("/flight");
    }
  );
});

router.get("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  connection.query(
    "SELECT * FROM flight WHERE Flight_ID = ?",
    [id],
    (err, flightResult) => {
      if (err) return res.send("Error fetching flight");

      connection.query("SELECT * FROM aircraft", (err, aircrafts) => {
        if (err) return res.send("Error fetching aircraft");

        connection.query("SELECT * FROM route", (err, routes) => {
          if (err) return res.send("Error fetching routes");

          res.render("flight/edit", {
            flight: flightResult[0],
            aircrafts,
            routes
          });
        });
      });
    }
  );
});

router.post("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;
  const { Aircraft_ID, Route_ID, Date, Time, Status, Available_seats } = req.body;

  const sql = `
    UPDATE flight
    SET Aircraft_ID = ?, Route_ID = ?, Date = ?, Time = ?, Status = ?, Available_seats = ?
    WHERE Flight_ID = ?
  `;

  connection.query(
    sql,
    [Aircraft_ID, Route_ID, Date, Time, Status, Available_seats, id],
    (err) => {
      if (err) {
        console.log(err);
        return res.send("Error updating flight");
      }
      res.redirect("/flight");
    }
  );
});

module.exports = router;