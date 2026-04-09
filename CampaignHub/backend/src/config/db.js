const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// This ensures the database file is created in the right spot
const dbPath = path.resolve(__dirname, '../../campaignhub.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database opening error: ", err);
    else console.log("Connected to SQLite database at: ", dbPath);
});
db.serialize(() => {
    // Create Table
    db.run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        category TEXT
    )`);

    // IMMEDIATELY CHECK IF EMPTY AND INSERT
    db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
        if (row && row.count === 0) {
            console.log("Empty DB detected. Inserting sample data...");
            db.run("INSERT INTO campaigns (title, description, category) VALUES (?, ?, ?)", 
                   ["Live Ocean Cleanup", "Help us save the reefs!", "Environment"]);
        }
    });
});

module.exports = db;