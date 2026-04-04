require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

// 1. MIDDLEWARE (The order is very important!)
//app.use(cors()); // Allow all connections for now
// Add this right after 'const app = express();'
app.use(cors({
  origin: '*', // This tells the server to allow requests from ANYWHERE (fixes 403)
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}));

// Add a very simple route to test the connection
app.get("/", (req, res) => {
    res.send("<h1>Impact Hub API is Running!</h1>");
});
app.use(express.json()); // Allow the server to read JSON data

// 2. ROUTES
// Health check to test if 403 is gone
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is accessible!" });
});

// Registration Route
app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;
    const sql = `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`;
    
    db.run(sql, [name, email, password], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User registered successfully!", id: this.lastID });
    });
});
app.post("/api/business-register", (req, res) => {
    const { user_id, business_name, abn, industry } = req.body;
    const sql = `INSERT INTO businesses (user_id, business_name, abn, industry) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [user_id, business_name, abn, industry], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Business details saved!", id: this.lastID });
    });
});
// User List Route (to verify the database)
app.get("/api/users", (req, res) => {
    db.all("SELECT id, name, email FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.get("/api/campaigns", (req, res) => {
    db.all("SELECT * FROM campaigns", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// 3. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying on http://localhost:${PORT}`);
});