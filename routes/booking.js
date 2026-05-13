const express = require("express");
const router = express.Router();
const connection = require("../config/db")
const { isUser, isAdmin } = require("../middleware/auth");


router.get("/add",isUser, (req, res) => {

  const sql = `
    SELECT f.*, r.Source, r.Destination 
    FROM flight f
    JOIN route r ON f.Route_ID = r.Route_ID
  `;

  connection.query(sql, (err, flights) => {
    if (err) return res.send("Error fetching flights");

    res.render("booking/add", { flights });
  });
});

router.post("/add",isUser, (req, res) => {
  const { Name, Phone, Email, Flight_ID } = req.body;

  connection.beginTransaction(err => {
    if (err) return res.send("Transaction error");

    // 1. Check seats
    connection.query(
      "SELECT Available_seats FROM flight WHERE Flight_ID = ?",
      [Flight_ID],
      (err, result) => {
        if (err || result.length === 0) {
          return connection.rollback(() => res.send("Flight not found"));
        }

        let seats = result[0].Available_seats;

        if (seats <= 0) {
          return connection.rollback(() => res.send("No seats available"));
        }

        // 2. Insert passenger
        const getLastPassenger = "SELECT Passenger_ID FROM passenger ORDER BY Passenger_ID DESC LIMIT 1";

        connection.query(getLastPassenger, (err, pResult) => {
          let newPassengerId;

          if (pResult.length === 0) newPassengerId = "P101";
          else {
            let num = parseInt(pResult[0].Passenger_ID.substring(1));
            newPassengerId = "P" + (num + 1);
          }

          connection.query(
            "INSERT INTO passenger VALUES (?, ?, ?, ?)",
            [newPassengerId, Name, Phone.toString(), Email],
            (err) => {
              if (err) {
                console.log(err);   // 🔥 THIS IS IMPORTANT
                return connection.rollback(() => res.send("Passenger error"));
            }

              // 3. Insert booking
              const getLastBooking = "SELECT Booking_ID FROM booking ORDER BY Booking_ID DESC LIMIT 1";

              connection.query(getLastBooking, (err, bResult) => {
                let newBookingId;

                if (bResult.length === 0) newBookingId = "B101";
                else {
                  let num = parseInt(bResult[0].Booking_ID.substring(1));
                  newBookingId = "B" + (num + 1);
                }

            connection.query(
                `INSERT INTO booking 
                (Booking_ID, Passenger_ID, Flight_ID, Seat_No, Booking_Status, Booking_Date) 
                VALUES (?, ?, ?, ?, ?, CURDATE())`,
                [newBookingId, newPassengerId, Flight_ID, 1, "CONFIRMED"],
            (err) => {
                if (err) {
                    console.log("Booking Error:", err);
                    return connection.rollback(() => res.send("Booking error"));
                }

                    // 4. Update seats
                    connection.query(
                      "UPDATE flight SET Available_seats = Available_seats - 1 WHERE Flight_ID = ?",
                      [Flight_ID],
                      (err) => {
                        if (err) return connection.rollback(() => res.send("Seat update error"));

                        // COMMIT
                        connection.commit(err => {
                          if (err) return connection.rollback(() => res.send("Commit error"));

                          res.redirect("/booking/my"); // or show success message
                        });
                      }
                    );
                  }
                );
              });
            }
          );
        });
      }
    );
  });
});

router.get("/",isAdmin,(req, res) => {
  const sql = `
    SELECT b.*, p.Name 
    FROM booking b
    JOIN passenger p ON b.Passenger_ID = p.Passenger_ID
  `;

  connection.query(sql, (err, results) => {
    if (err) return res.send("Error fetching bookings");

    res.render("booking/index", { bookings: results });
  });
});

router.get("/index", (req, res) => {
  if (req.session.role === "admin") {
    return res.redirect("/booking");
  }

  if (req.session.role === "user") {
    return res.redirect("/booking/my");
  }

  res.redirect("/login");
});

router.get("/my", isUser, (req, res) => {
  const userEmail = req.session.user.Email;

  const sql = `
    SELECT b.*, p.Name, f.Flight_ID, r.Source, r.Destination
    FROM booking b
    JOIN passenger p ON b.Passenger_ID = p.Passenger_ID
    JOIN flight f ON b.Flight_ID = f.Flight_ID
    JOIN route r ON f.Route_ID = r.Route_ID
    WHERE p.Email = ?
  `;

  connection.query(sql, [userEmail], (err, results) => {
    if (err) {
      console.log(err);
      return res.send("Error fetching bookings");
    }

    res.render("booking/index", { bookings: results });
  });
});

router.get("/cancel/:id", (req, res) => {
  const bookingId = req.params.id;

  connection.beginTransaction(err => {
    if (err) return res.send("Transaction error");

    // 1. Get Flight_ID from booking
    connection.query(
      "SELECT Flight_ID, Booking_Status FROM booking WHERE Booking_ID = ?",
      [bookingId],
      (err, result) => {
        if (err || result.length === 0) {
          return connection.rollback(() => res.send("Booking not found"));
        }

        const { Flight_ID, Booking_Status } = result[0];

        // Prevent double cancel
        if (Booking_Status === "CANCELLED") {
          return connection.rollback(() => res.send("Already cancelled"));
        }

        // 2. Update booking status
        connection.query(
          "UPDATE booking SET Booking_Status = 'CANCELLED' WHERE Booking_ID = ?",
          [bookingId],
          (err) => {
            if (err) {
              console.log(err);
              return connection.rollback(() => res.send("Error updating booking"));
            }

            // 3. Increase seat
            connection.query(
              "UPDATE flight SET Available_seats = Available_seats + 1 WHERE Flight_ID = ?",
              [Flight_ID],
              (err) => {
                if (err) {
                  console.log(err);
                  return connection.rollback(() => res.send("Error updating seats"));
                }

                // COMMIT
                connection.commit(err => {
                  if (err) {
                    return connection.rollback(() => res.send("Commit error"));
                  }

                  res.redirect("/booking"); // or show success
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;