<<<<<<< HEAD
app.use(cors());
app.use(express.json());
=======
>>>>>>> fddbe34d14b70d0c6e3cebba414bd7f8bd57644e
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// optional root route for checking backend in browser
app.get("/", (req, res) => {
  res.send("<h1>Impact Hub API is Running!</h1>");
});

// health check
app.get("/api/health", (req, res) => {
<<<<<<< HEAD
    res.json({ status: "ok", database: "connected" });
=======
  res.json({ status: "ok", message: "Server is accessible!" });
>>>>>>> fddbe34d14b70d0c6e3cebba414bd7f8bd57644e
});

// auth routes
app.use("/api/auth", authRoutes);

// business route
app.post("/api/business-register", (req, res) => {
  const { user_id, business_name, abn, industry } = req.body;
  const sql = `INSERT INTO businesses (user_id, business_name, abn, industry) VALUES (?, ?, ?, ?)`;

  db.run(sql, [user_id, business_name, abn, industry], function (err) {
    if (err) return res.status(400).json({ message: err.message });
    res.json({ message: "Business details saved!", id: this.lastID });
  });
});

// users route
app.get("/api/users", (req, res) => {
  db.all("SELECT id, name, email FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// campaigns route
app.get("/api/campaigns", (req, res) => {
  db.all("SELECT * FROM campaigns", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});