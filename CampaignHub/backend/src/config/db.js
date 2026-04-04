const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// This ensures the database file is created in the right spot
const DB_FILE = path.join(__dirname, "../../campaignhub.db");

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) console.error("Database opening error:", err.message);
    else console.log("Connected to SQLite database.");
});

db.serialize(() => {
    // 1. Users Table (Includes 'state' and 'role')
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        state TEXT, 
        role TEXT DEFAULT 'user', -- e.g., 'individual', 'business', 'admin'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Business Details Table (Linked to a User)
    db.run(`CREATE TABLE IF NOT EXISTS businesses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        business_name TEXT,
        abn TEXT,
        industry TEXT,
        website TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // 3. Campaign Details Table
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT, -- e.g., 'Environment', 'Education'
        goal_amount REAL,
        current_amount REAL DEFAULT 0,
        creator_id INTEGER,
        status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
        FOREIGN KEY (creator_id) REFERENCES users (id)
    )`);
});

module.exports = db;