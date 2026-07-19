const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Student = require('../models/Student');

// @route   GET /students
// @desc    Get all students from MongoDB
// @access  Public
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error while fetching students',
      error: error.message
    });
  }
});

// @route   GET /students/:id
// @desc    Get single student by ID
// @access  Public
router.get('/students/:id', async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { studentId: req.params.id };

    const student = await Student.findOne(filter);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error fetching student detail',
      error: error.message
    });
  }
});

// @route   POST /students
// @desc    Create new student record
// @access  Public
router.post('/students', async (req, res) => {
  try {
    const {
      name,
      rollNo,
      class: className,
      email,
      phone,
      department,
      semester,
      gender,
      dob,
      parentName,
      parentPhone,
      address,
      attendance,
      marks
    } = req.body;

    // Generate studentId if not provided
    let studentId = req.body.studentId;
    if (!studentId) {
      const count = await Student.countDocuments();
      studentId = `STU${String(count + 1).padStart(3, '0')}`;
    }

    const newStudent = await Student.create({
      studentId,
      name,
      rollNo,
      class: className,
      email,
      phone,
      department,
      semester,
      gender,
      dob,
      parentName,
      parentPhone,
      address,
      attendance: attendance || {},
      marks: marks || { internal: {}, semester: {} }
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: newStudent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create student record',
      error: error.message
    });
  }
});

// @route   PUT /students/:id
// @desc    Update existing student record by ID
// @access  Public
router.put('/students/:id', async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { studentId: req.params.id };

    const updatedStudent = await Student.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found for update'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update student record',
      error: error.message
    });
  }
});

// @route   DELETE /students/:id
// @desc    Delete student record by ID
// @access  Public
router.delete('/students/:id', async (req, res) => {
  try {
    const filter = mongoose.Types.ObjectId.isValid(req.params.id)
      ? { _id: req.params.id }
      : { studentId: req.params.id };

    const deletedStudent = await Student.findOneAndDelete(filter);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found for deletion'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
      data: deletedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student record',
      error: error.message
    });
  }
});

module.exports = router;
