const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
});

module.exports = db;