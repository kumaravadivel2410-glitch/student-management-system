const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// Seed default subjects if empty
const seedDefaultSubjects = async () => {
  const count = await Subject.countDocuments();
  if (count === 0) {
    await Subject.create([
      { code: 'MA101', name: 'Mathematics' },
      { code: 'SC102', name: 'Science' },
      { code: 'EN103', name: 'English' },
      { code: 'HI104', name: 'History' },
      { code: 'CS105', name: 'Computer Science' }
    ]);
  }
};

// GET /api/subjects
router.get('/subjects', async (req, res) => {
  try {
    await seedDefaultSubjects();
    const subjects = await Subject.find().sort({ code: 1 });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects.', error: error.message });
  }
});

// POST /api/subjects
router.post('/subjects', async (req, res) => {
  try {
    const { code, name } = req.body;
    const newSubject = await Subject.create({ code, name });
    res.status(201).json({ success: true, message: 'Subject created.', data: newSubject });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create subject.', error: error.message });
  }
});

// DELETE /api/subjects/:id
router.delete('/subjects/:id', async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    if (!deletedSubject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, message: 'Subject deleted.', data: deletedSubject });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subject.', error: error.message });
  }
});

module.exports = router;
