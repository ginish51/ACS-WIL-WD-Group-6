const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

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

  db.run(`ALTER TABLE users ADD COLUMN state TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, () => {});

  db.run(`CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    business_name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    abn TEXT,
    industry TEXT,
    website TEXT,
    image_url TEXT,
    rating REAL DEFAULT 4.8,
    trending TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`ALTER TABLE businesses ADD COLUMN category TEXT`, () => {});
  db.run(`ALTER TABLE businesses ADD COLUMN description TEXT`, () => {});
  db.run(`ALTER TABLE businesses ADD COLUMN image_url TEXT`, () => {});
  db.run(`ALTER TABLE businesses ADD COLUMN rating REAL DEFAULT 4.8`, () => {});
  db.run(`ALTER TABLE businesses ADD COLUMN trending TEXT DEFAULT 'New'`, () => {});
  db.run(`ALTER TABLE businesses ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, () => {});

 db.run(`CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  goal_amount REAL,
  goal_users INTEGER,
  current_amount REAL DEFAULT 0,
  creator_id INTEGER,
  status TEXT DEFAULT 'pending',
  reviewed_at DATETIME,
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users (id)
)`);

db.run(`ALTER TABLE campaigns ADD COLUMN image_url TEXT`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN goal_amount REAL`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN goal_users INTEGER`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN current_amount REAL DEFAULT 0`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN creator_id INTEGER`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'pending'`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN reviewed_at DATETIME`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN rejection_reason TEXT`, () => {});
db.run(`ALTER TABLE campaigns ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, () => {});

  // seed admin account
  const adminEmail = "admin@impacthub.com";
  const adminPassword = "Admin123!";
  const adminName = "Impact Hub Admin";
  const adminHash = bcrypt.hashSync(adminPassword, 10);

  db.get("SELECT id FROM users WHERE email = ?", [adminEmail], (err, row) => {
    if (err) {
      console.error("Admin check error:", err.message);
      return;
    }

    if (!row) {
      db.run(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES (?, ?, ?, ?)`,
        [adminName, adminEmail, adminHash, "admin"],
        (insertErr) => {
          if (insertErr) {
            console.error("Admin insert error:", insertErr.message);
          } else {
            console.log("Seeded admin account:", adminEmail);
          }
        }
      );
    }
  });

  // seed one active campaign only if table is empty
  db.get("SELECT COUNT(*) AS count FROM campaigns", (err, row) => {
    if (err) {
      console.error("Count campaigns error:", err.message);
      return;
    }

    if (row && row.count === 0) {
      db.run(
        `INSERT INTO campaigns
         (title, description, category, image_url, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "Live Ocean Cleanup",
          "Help us save the reefs!",
          "Environment",
          "images/ocean.jpg",
          "active"
        ]
      );
    }
  });
});

module.exports = db;