const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const { signToken, authenticateToken } = require("../utils/auth");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createUser(name, email, passwordHash) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, email });
      }
    );
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters."
      });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        message: "Email is already registered."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, passwordHash);

    return res.status(201).json({
      message: "Registered successfully.",
      user
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    const token = signToken(safeUser);

    console.log("LOGIN SUCCESS:", safeUser);

    return res.json({
      message: "Login successful.",
      token,
      user: safeUser
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    next(error);
  }
});

router.get("/me", authenticateToken, (req, res) => {
  return res.json({
    user: req.user
  });
});

module.exports = router;