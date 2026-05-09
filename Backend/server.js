const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const exportRoutes = require("./routes/exportRoutes");
const sanitizeRequest = require("./middleware/sanitizeMiddleware");

dotenv.config({ quiet: true });

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://hiresight-ai-vert.vercel.app"
  ],
  credentials: true
}));

// Set security HTTP headers
app.use(helmet());

// Rate limiting for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body, with a size limit
app.use(express.json({ limit: "64kb" }));

// Data sanitization against NoSQL query injection and XSS.
// The third-party middleware assigns req.query, which is read-only in Express 5.
app.use(sanitizeRequest);


app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);

app.get("/", (req, res) => {
  res.send("HireSight API Running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});
