const express = require("express");
const app = express();
const cors = require("cors");
const analyzeRoutes = require("./routes/analyze.routes");

require("dotenv").config();
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
app.use("/api", analyzeRoutes);

app.get("/", (req, res) => {
  res.json({ message: "RepoLens API is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
