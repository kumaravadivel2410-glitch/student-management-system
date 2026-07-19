const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'college_settings', unique: true },
    collegeName: { type: String, default: 'J.P. College of Engineering' },
    shortName: { type: String, default: 'JPCOE' },
    department: { type: String, default: 'Artificial Intelligence and Data Science' },
    portalTitle: { type: String, default: 'Student Management Portal' },
    features: {
      attendance: { type: Boolean, default: true },
      marks: { type: Boolean, default: true },
      homework: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
      subjects: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
