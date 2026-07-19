const express = require('express');
const router = express.Router();
const { Assignment } = require('../models/Assignment');

// Seed default assignments if empty
const seedDefaultAssignments = async () => {
  const count = await Assignment.countDocuments();
  if (count === 0) {
    await Assignment.create([
      { id: 'HW001', assignmentId: 'HW001', class: 'Class A', subject: 'Mathematics', title: 'Calculus Problems 1-10', description: 'Solve problems on page 42 regarding derivatives.', dueDate: '2026-07-25', submissions: [] },
      { id: 'HW002', assignmentId: 'HW002', class: 'Class A', subject: 'Computer Science', title: 'Binary Search Implementation', description: 'Write a binary search algorithm in JavaScript.', dueDate: '2026-07-28', submissions: [] },
      { id: 'HW003', assignmentId: 'HW003', class: 'Class B', subject: 'Science', title: 'Chemical Bonding Report', description: 'Write a 2-page report on covalent vs ionic bonds.', dueDate: '2026-07-24', submissions: [] }
    ]);
  }
};

// GET /api/assignments
router.get('/assignments', async (req, res) => {
  try {
    await seedDefaultAssignments();
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.', error: error.message });
  }
});

// POST /api/assignments
router.post('/assignments', async (req, res) => {
  try {
    let assignmentId = req.body.assignmentId || req.body.id;
    if (!assignmentId) {
      const count = await Assignment.countDocuments();
      assignmentId = `HW${String(count + 1).padStart(3, '0')}`;
    }
    const newAssignment = await Assignment.create({ ...req.body, assignmentId });
    res.status(201).json({ success: true, message: 'Assignment created.', data: newAssignment });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create assignment.', error: error.message });
  }
});

// POST /api/assignments/:id/submit
router.post('/assignments/:id/submit', async (req, res) => {
  try {
    const { studentEmail, studentName, solutionText, submittedAt } = req.body;
    const assignment = await Assignment.findOne({
      $or: [{ _id: req.params.id }, { assignmentId: req.params.id }]
    });

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });

    // Remove old submission if re-submitting
    assignment.submissions = assignment.submissions.filter(s => s.studentEmail !== studentEmail);
    assignment.submissions.push({
      assignmentId: assignment.assignmentId,
      studentEmail,
      studentName,
      solutionText,
      submittedAt: submittedAt || new Date().toISOString().split('T')[0]
    });

    await assignment.save();
    res.status(200).json({ success: true, message: 'Homework submitted successfully.', data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit homework.', error: error.message });
  }
});

module.exports = router;
