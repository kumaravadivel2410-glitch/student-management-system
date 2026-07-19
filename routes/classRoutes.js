const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create class
router.post('/classes', async (req, res) => {
  try {
    const { name, faculty } = req.body;
    const existing = await Class.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Class name already registered' });
    }
    const newClass = await Class.create({ name, faculty });
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete class
router.delete('/classes/:name', async (req, res) => {
  try {
    const deleted = await Class.findOneAndDelete({ name: req.params.name });
    if (!deleted) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
