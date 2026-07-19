const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: String,
      unique: true
    },
    class: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
