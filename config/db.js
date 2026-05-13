const mysql = require("mysql2");

// create connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tiger", 
  database: "airline_db"
});

// connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});

module.exports = connection;