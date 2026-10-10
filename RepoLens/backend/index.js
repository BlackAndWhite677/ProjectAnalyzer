require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const jobFitRoutes = require("./routes/jobFit.routes");
const analyzeRoutes = require("./routes/analyze.routes");
app.use(express.json());

const PORT = process.env.PORT || 4000;

const connectDB = require("./config/db");
connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Routes
app.use("/api", jobFitRoutes);
app.use("/api", analyzeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "RepoLens API is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
