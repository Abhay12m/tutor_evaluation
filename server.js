require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =========================================
// ALLOWED ORIGINS
// =========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://testing.allysolution.com",
];

// =========================================
// CORS CONFIG
// =========================================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      // (mobile apps, postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error("Not allowed by CORS")
        );
      }
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    credentials: true,
  })
);

// =========================================
// HANDLE PREFLIGHT
// =========================================

app.options("*", cors());

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
  res.send(
    "AI Tutor Evaluator Backend Running"
  );
});

// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `✅ Server running on port ${PORT}`
  );
});