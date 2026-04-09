const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 1. Set the Path - This places the DB in your 'backend' folder
const dbPath = path.resolve(__dirname, '../../campaignhub.db');

// 2. Connect to Database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database opening error:", err.message);
    } else {
        console.log("Connected to SQLite database at:", dbPath);
    }
});

// 3. Create Tables and Seed Data
db.serialize(() => {
    // Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        state TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Businesses Table
    db.run(`CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        business_name TEXT,
        abn TEXT,
        industry TEXT,
        website TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Create Campaigns Table
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        image_url TEXT,
        goal_amount REAL,
        current_amount REAL DEFAULT 0,
        creator_id INTEGER,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (creator_id) REFERENCES users (id)
    )`);

    // 4. SEED TEST USER (Crucial for Login testing)
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
        if (row && row.count === 0) {
            console.log("No users found. Seeding test account...");
            // Use a simple password for testing: 'password123'
            db.run(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ["Test Admin", "admin@impact.com", "password123", "admin"]
            );
        }
    });

    // 5. SEED CAMPAIGNS
    db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
        if (row && row.count === 0) {
            console.log("No campaigns found. Seeding sample data...");
            db.run(
                "INSERT INTO campaigns (title, description, category, image_url) VALUES (?, ?, ?, ?)",
                ["Live Ocean Cleanup", "Help us save the reefs!", "Environment", "https://via.placeholder.com/300"]
            );
        }
    });
});

// 6. EXPORT (If you forget this, server.js will crash!)
module.exports = db;