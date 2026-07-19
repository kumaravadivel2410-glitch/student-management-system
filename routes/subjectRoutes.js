const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// GET /subjects
router.get('/subjects', async (req, res) => {
  try {
    const list = await Subject.find();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /subjects
router.post('/subjects', async (req, res) => {
  try {
    const { code, name } = req.body;
    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject code already registered' });
    }
    const newSubject = await Subject.create({ code, name });
    res.status(201).json({ success: true, data: newSubject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
