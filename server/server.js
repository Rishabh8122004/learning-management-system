require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const goalRoutes = require("./routes/goalRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const learningPathRoutes = require('./routes/learningPathRoutes');
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/courses', courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LMS backend is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});