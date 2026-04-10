require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { authenticateToken } = require("./utils/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Impact Hub API is Running!</h1>");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is accessible!"
  });
});

app.use("/api/auth", authRoutes);

// uploads
const uploadsRoot = path.join(__dirname, "../uploads");
const businessUploadsDir = path.join(uploadsRoot, "businesses");
const campaignUploadsDir = path.join(uploadsRoot, "campaigns");

[businessUploadsDir, campaignUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use("/uploads", express.static(uploadsRoot));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.path.includes("/api/businesses")) {
      cb(null, businessUploadsDir);
    } else if (req.path.includes("/api/campaigns")) {
      cb(null, campaignUploadsDir);
    } else {
      cb(null, uploadsRoot);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeBase = path
      .basename(file.originalname || "file", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    cb(null, `${Date.now()}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed."));
    }
    cb(null, true);
  }
});

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// businesses
app.post("/api/businesses", upload.single("image"), authenticateToken, (req, res) => {
  const {
    business_name,
    category,
    description,
    abn,
    industry,
    website,
    rating,
    trending
  } = req.body;

  if (!business_name) {
    return res.status(400).json({ message: "Business name is required." });
  }

  const image_url = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/businesses/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO businesses
    (user_id, business_name, category, description, abn, industry, website, image_url, rating, trending)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      req.user.id,
      business_name,
      category || null,
      description || null,
      abn || null,
      industry || null,
      website || null,
      image_url,
      rating || 4.8,
      trending || "New"
    ],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });

      res.status(201).json({
        message: "Business created successfully.",
        id: this.lastID,
        image_url
      });
    }
  );
});

app.get("/api/businesses", (req, res) => {
  db.all("SELECT * FROM businesses ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// campaigns: submit -> pending
app.post("/api/campaigns", upload.single("image"), authenticateToken, (req, res) => {
  const {
    title,
    description,
    category,
    goal_amount
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Campaign title is required." });
  }

  const image_url = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/campaigns/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO campaigns
    (title, description, category, image_url, goal_amount, current_amount, creator_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      title,
      description || null,
      category || null,
      image_url,
      goal_amount || null,
      0,
      req.user.id,
      "pending"
    ],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });

      res.status(201).json({
        message: "Campaign submitted for approval.",
        id: this.lastID,
        image_url
      });
    }
  );
});

// public landing page campaigns: only active
app.get("/api/campaigns", (req, res) => {
  db.all(
    "SELECT * FROM campaigns WHERE status = 'active' ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

// logged-in user's campaigns
app.get("/api/my-campaigns", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM campaigns WHERE creator_id = ? ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

app.get("/api/my-campaign-stats", authenticateToken, (req, res) => {
  const sql = `
    SELECT
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
    FROM campaigns
    WHERE creator_id = ?
  `;

  db.get(sql, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({
      active_count: row?.active_count || 0,
      pending_count: row?.pending_count || 0,
      rejected_count: row?.rejected_count || 0
    });
  });
});

// admin dashboard
app.get("/api/admin/campaigns/pending", authenticateToken, requireAdmin, (req, res) => {
  db.all(
    "SELECT * FROM campaigns WHERE status = 'pending' ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});

app.patch("/api/admin/campaigns/:id/approve", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE campaigns
     SET status = 'active', reviewed_at = datetime('now'), rejection_reason = NULL
     WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });
      res.json({ message: "Campaign approved." });
    }
  );
});

app.patch("/api/admin/campaigns/:id/reject", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  db.run(
    `UPDATE campaigns
     SET status = 'rejected', reviewed_at = datetime('now'), rejection_reason = ?
     WHERE id = ?`,
    [rejection_reason || null, id],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });
      res.json({ message: "Campaign rejected." });
    }
  );
});

app.get("/api/users", (req, res) => {
  db.all("SELECT id, name, email, role FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// upload / generic error
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || "Upload failed." });
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});