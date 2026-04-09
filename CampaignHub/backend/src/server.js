require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

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

// uploads directory
const uploadsRoot = path.join(__dirname, "../uploads");
const businessUploadsDir = path.join(uploadsRoot, "businesses");
const campaignUploadsDir = path.join(uploadsRoot, "campaigns");

[businessUploadsDir, campaignUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// serve uploaded files
app.use("/uploads", express.static(uploadsRoot));

// multer storage
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

// create business with image upload
app.post("/api/businesses", upload.single("image"), (req, res) => {
  const {
    user_id,
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
      user_id || null,
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

// get businesses
app.get("/api/businesses", (req, res) => {
  db.all("SELECT * FROM businesses ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// create campaign with image upload
app.post("/api/campaigns", upload.single("image"), (req, res) => {
  const {
    title,
    description,
    category,
    goal_amount,
    current_amount,
    creator_id,
    status
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
      current_amount || 0,
      creator_id || null,
      status || "active"
    ],
    function (err) {
      if (err) return res.status(400).json({ message: err.message });

      res.status(201).json({
        message: "Campaign created successfully.",
        id: this.lastID,
        image_url
      });
    }
  );
});

// get campaigns
app.get("/api/campaigns", (req, res) => {
  db.all("SELECT * FROM campaigns ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.get("/api/users", (req, res) => {
  db.all("SELECT id, name, email FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// multer / generic error handler
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