const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// GET /assignments
router.get('/assignments', async (req, res) => {
  try {
    const list = await Assignment.find();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /assignments
router.post('/assignments', async (req, res) => {
  try {
    const { class: className, subject, title, description, dueDate } = req.body;
    
    // Generate assignmentId
    const count = await Assignment.countDocuments();
    const assignmentId = `HW${String(count + 1).padStart(3, '0')}`;

    const newAssignment = await Assignment.create({
      assignmentId,
      class: className,
      subject,
      title,
      description,
      dueDate
    });
    res.status(201).json({ success: true, data: newAssignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /submissions
router.get('/submissions', async (req, res) => {
  try {
    const list = await Submission.find();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /submissions
router.post('/submissions', async (req, res) => {
  try {
    const { assignmentId, studentId, text, submittedAt } = req.body;
    
    const count = await Submission.countDocuments();
    const submissionId = `SUB${String(count + 1).padStart(3, '0')}`;

    const newSubmission = await Submission.create({
      submissionId,
      assignmentId,
      studentId,
      text,
      submittedAt
    });
    res.status(201).json({ success: true, data: newSubmission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
