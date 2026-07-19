const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// Connect to MongoDB Atlas Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', studentRoutes);

// Base / Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Student Management System API is running successfully'
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
