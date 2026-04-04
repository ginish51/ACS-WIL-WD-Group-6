const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware to parse JSON
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.log("Failed to connect:", err));

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));