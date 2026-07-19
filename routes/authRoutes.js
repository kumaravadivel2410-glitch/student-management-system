const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Seed default users if collection is empty
const seedDefaultUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create([
      {
        username: 'admin',
        name: 'Permanent Administrator',
        email: 'adminjpcoe@gmail.edu',
        password: 'admin123',
        role: 'admin',
        phone: '+1 (555) 0199',
        approved: true
      },
      {
        username: 'faculty',
        name: 'Prof. Sarah Jenkins',
        email: 's.jenkins@school.edu',
        password: 'faculty123',
        role: 'faculty',
        phone: '+1 (555) 0188',
        classAssigned: 'Class A',
        approved: true
      },
      {
        username: 'student',
        name: 'Liam Johnson',
        email: 'liam@school.edu',
        password: 'student123',
        role: 'student',
        phone: '+1 (555) 0101',
        approved: true
      }
    ]);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user account
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const username = normalizedEmail.split('@')[0];
    const newUser = await User.create({
      username,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      approved: false
    });

    res.status(201).json({ success: true, message: 'Registration submitted successfully.', data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register account.', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user login
router.post('/auth/login', async (req, res) => {
  try {
    await seedDefaultUsers();
    const { emailOrUsername, password } = req.body;
    const input = (emailOrUsername || '').toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: input }, { username: input }]
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.approved === false) {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
    }

    res.status(200).json({ success: true, message: 'Login successful.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login server error.', error: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users for Admin approval dashboard
router.get('/users', async (req, res) => {
  try {
    await seedDefaultUsers();
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
  }
});

// @route   PUT /api/users/:id/approve
// @desc    Approve user account registration
router.put('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User approved.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve user.', error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Reject / Delete user account registration
router.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User registration rejected and removed.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
  }
});

module.exports = router;
