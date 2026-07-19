const express = require('express');
const router = express.Router();
const Class = require('../models/Class');

// Seed default classes if empty
const seedDefaultClasses = async () => {
  const count = await Class.countDocuments();
  if (count === 0) {
    await Class.create([
      { name: 'Class A', faculty: 'Prof. Sarah Jenkins' },
      { name: 'Class B', faculty: 'Prof. Michael Chang' },
      { name: 'Class C', faculty: 'Dr. Elena Rostova' }
    ]);
  }
};

// GET /api/classes
router.get('/classes', async (req, res) => {
  try {
    await seedDefaultClasses();
    const classes = await Class.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.', error: error.message });
  }
});

// POST /api/classes
router.post('/classes', async (req, res) => {
  try {
    const { name, faculty } = req.body;
    const newClass = await Class.create({ name, faculty });
    res.status(201).json({ success: true, message: 'Class created.', data: newClass });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create class.', error: error.message });
  }
});

// DELETE /api/classes/:id
router.delete('/classes/:id', async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.status(200).json({ success: true, message: 'Class deleted.', data: deletedClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete class.', error: error.message });
  }
});

module.exports = router;
