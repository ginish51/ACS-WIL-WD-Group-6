const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Set the Path (Only do this ONCE)
const dbPath = path.resolve(__dirname, '../../campaignhub.db');

// 2. Connect to Database (Only do this ONCE)
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

    // Create Campaigns Table (Included image_url)
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

    // 4. EMERGENCY SEED: If campaigns table is empty, add data!
    db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
        if (err) {
            console.error("Count campaigns error:", err.message);
            return;
        }

        if (row && row.count === 0) {
            console.log("Empty campaigns table detected. Seeding sample data...");
            db.run(
                "INSERT INTO campaigns (title, description, category, image_url) VALUES (?, ?, ?, ?)",
                ["Live Ocean Cleanup", "Help us save the reefs!", "Environment", "https://via.placeholder.com/300"]
            );
        }
    });
});

module.exports = db;