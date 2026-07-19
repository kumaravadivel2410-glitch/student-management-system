const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    solutionText: { type: String, required: true },
    submittedAt: { type: String, required: true }
  },
  { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: String, required: true },
    submissions: [submissionSchema]
  },
  { timestamps: true }
);

module.exports = {
  Assignment: mongoose.model('Assignment', assignmentSchema),
  Submission: mongoose.model('Submission', submissionSchema)
};
