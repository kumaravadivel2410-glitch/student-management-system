const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Import REST API Route Modules
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Connect to MongoDB Atlas Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api', studentRoutes);
app.use('/api', authRoutes);
app.use('/api', classRoutes);
app.use('/api', subjectRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', settingsRoutes);

// Base / Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Full Stack Student Management System REST API & MongoDB Database are running successfully'
  });
});

// Fallback 404 Route
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
