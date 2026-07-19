const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'college_settings' });
    if (!settings) {
      settings = await Settings.create({ key: 'college_settings' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.', error: error.message });
  }
});

// PUT /api/settings
router.put('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOneAndUpdate(
      { key: 'college_settings' },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Settings saved.', data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to save settings.', error: error.message });
  }
});

module.exports = router;
