const express = require("express");
const router = express.Router();
const connection = require("../config/db")
const { isAdmin } = require("../middleware/auth");

router.get("/",isAdmin ,(req, res) => {
  connection.query("SELECT * FROM aircraft", (err, results) => {
    if (err) throw err;
    res.render("aircraft/index", { aircrafts: results });
  });
});

router.get("/add", isAdmin,(req, res) => {
  res.render("aircraft/add");
});

router.post("/add", isAdmin,(req, res) => {
  const { model, capacity, status } = req.body;

  // Step 1: Get last Aircraft_ID
  const getLastIdQuery = "SELECT Aircraft_ID FROM aircraft ORDER BY Aircraft_ID DESC LIMIT 1";

  connection.query(getLastIdQuery, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching last ID");
    }

    let newId;

    if (result.length === 0) {
      // first entry
      newId = "A101";
    } else {
      let lastId = result[0].Aircraft_ID; // A101

      let numberPart = parseInt(lastId.substring(1)); // 101
      numberPart++;

      newId = "A" + numberPart; // A102
    }

    // Step 2: Insert new aircraft
    const insertQuery = "INSERT INTO aircraft (Aircraft_ID, Model, Capacity, Status) VALUES (?, ?, ?, ?)";

    connection.query(insertQuery, [newId, model, capacity, status], (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error inserting data");
      }

      res.redirect("/aircraft");
    });
  });
});

router.get("/delete/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  const checkSql = "SELECT COUNT(*) AS count FROM flight WHERE Aircraft_ID = ?";
  connection.query(checkSql, [id], (err, checkResult) => {
    if (err) {
      console.log(err);
      return res.send("Error checking aircraft usage");
    }

    if (checkResult[0].count > 0) {
      return res.send("Cannot delete this aircraft because it is assigned to one or more flights. Remove or reassign those flights first.");
    }

    const sql = "DELETE FROM aircraft WHERE Aircraft_ID = ?";
    connection.query(sql, [id], (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Error deleting aircraft");
      }

      res.redirect("/aircraft");
    });
  });
});

router.get("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;

  connection.query("SELECT * FROM aircraft WHERE Aircraft_ID = ?", [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching aircraft");
    }

    res.render("aircraft/edit", { aircraft: result[0] });
  });
});

router.post("/edit/:id",isAdmin, (req, res) => {
  const id = req.params.id;
  const { model, capacity, status } = req.body;

  const sql = `
    UPDATE aircraft 
    SET Model = ?, Capacity = ?, Status = ?
    WHERE Aircraft_ID = ?
  `;

  connection.query(sql, [model, capacity, status, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error updating aircraft");
    }

    res.redirect("/aircraft");
  });
});

module.exports = router