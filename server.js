require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =========================================
// CORS CONFIGURATION
// =========================================

app.use(
  cors({
    origin: [
  "http://localhost:5173",
  "https://testing.allysolution.com",
],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// =========================================
// MIDDLEWARE
// =========================================

app.use(express.json());

// =========================================
// ROUTES
// =========================================

app.use("/api", require("./routes/routes"));

// =========================================
// HEALTH CHECK
// =========================================

app.get("/", (req, res) => {
  res.send("AI Tutor Evaluator Backend Running");
});

// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});