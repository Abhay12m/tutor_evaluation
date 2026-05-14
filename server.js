require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =========================================
// CORS
// =========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://testing.allysolution.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked"));
      }
    },

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
// HEALTH ROUTE
// =========================================

app.get("/", (req, res) => {
  res.status(200).send("Backend Running");
});

// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});