const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true
    },
    rollNo: {
      type: String,
      required: [true, 'Please provide roll number'],
      trim: true
    },
    class: {
      type: String,
      required: [true, 'Please specify assigned class'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'AI&DS'
    },
    semester: {
      type: String,
      default: 'Semester 1'
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    dob: {
      type: String,
      default: ''
    },
    parentName: {
      type: String,
      default: ''
    },
    parentPhone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    attendance: {
      type: Map,
      of: String,
      default: {}
    },
    marks: {
      internal: {
        type: Map,
        of: Number,
        default: {}
      },
      semester: {
        type: Map,
        of: Number,
        default: {}
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Student', studentSchema);
