const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      unique: true
    },
    assignmentId: {
      type: String,
      required: true
    },
    studentId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    submittedAt: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
