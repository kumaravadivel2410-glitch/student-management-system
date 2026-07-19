const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, name, role, email, phone, classAssigned } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or Email already registered' });
    }

    // Default admin and predefined defaults to auto-approve, others false
    const approved = (role === 'admin' || username === 'admin' || username === 'faculty' || username === 'student');

    const newUser = await User.create({
      username,
      password, // Simple clear text for auth matching compatibility
      name,
      role,
      email,
      phone,
      classAssigned: classAssigned || '',
      approved
    });

    res.status(201).json({ success: true, message: 'User registered successfully', data: newUser });
  } catch (error) {
    res.status(550).json({ success: false, error: error.message });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.approved) {
      return res.status(403).json({ success: false, message: 'Your account is pending administrator approval.' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
router.get('/auth/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve user
router.put('/auth/approve/:username', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { approved: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.put('/auth/update/:username', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      req.body,
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
router.delete('/auth/delete/:username', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
