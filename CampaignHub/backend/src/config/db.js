const sqlite3 = require('sqlite3').verbose();
const path = require('path');

<<<<<<< HEAD
// Fix: Absolute path ensures Render finds the file correctly
const dbPath = path.resolve(__dirname, '../../campaignhub.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        category TEXT,
        image_url TEXT
    )`);

    // 2. EMERGENCY SEED: If table is empty, add data!
    db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
        if (row && row.count === 0) {
            console.log("Seeding data for frontend team...");
            db.run(`INSERT INTO campaigns (title, description, category, image_url) 
                    VALUES ('Ocean Cleanup', 'Removing plastic from beaches.', 'Environment', 'https://images.unsplash.com/photo-1484503781912-7c4a065757d4')`);
        }
    });
=======
const dbPath = path.resolve(__dirname, "../../campaignhub.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database opening error:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    state TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    business_name TEXT,
    abn TEXT,
    industry TEXT,
    website TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    goal_amount REAL,
    current_amount REAL DEFAULT 0,
    creator_id INTEGER,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (creator_id) REFERENCES users (id)
  )`);

  db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
    if (err) {
      console.error("Count campaigns error:", err.message);
      return;
    }

    if (row && row.count === 0) {
      console.log("Empty campaigns table detected. Inserting sample data...");
      db.run(
        "INSERT INTO campaigns (title, description, category) VALUES (?, ?, ?)",
        ["Live Ocean Cleanup", "Help us save the reefs!", "Environment"]
      );
    }
  });
>>>>>>> fddbe34d14b70d0c6e3cebba414bd7f8bd57644e
});

module.exports = db;