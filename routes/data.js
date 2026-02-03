const express     = require('express');
const SchoolData  = require('../models/SchoolData');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   GET /api/data   (protected)
   Returns the full school-data document for the current user.
   If none exists yet, creates an empty one automatically.
   ═══════════════════════════════════════════════════════════ */
router.get('/', protect, async (req, res) => {
  try {
    let data = await SchoolData.findOne({ owner: req.user._id });

    if (!data) {
      // First login on this account – bootstrap an empty document
      data = await SchoolData.create({ owner: req.user._id });
    }

    // Strip mongoose internals; send only the payload fields
    const payload = data.toObject();
    delete payload._id;
    delete payload.__v;
    delete payload.owner;
    delete payload.createdAt;
    delete payload.updatedAt;

    res.json({ success: true, data: payload });
  } catch (err) {
    console.error('GET /data error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch data.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/data   (protected)
   Replaces the school-data document wholesale.
   Body keys must match SchoolData schema fields.
   ═══════════════════════════════════════════════════════════ */
router.post('/', protect, async (req, res) => {
  try {
    const allowed = [
      'users', 'students', 'teachers', 'payments', 'expenses',
      'grades', 'reports', 'messages', 'attendance',
      'studentCounters', 'teacherCounter', 'receiptCounter', 'expenseCounter'
    ];

    // Build an update object with only the whitelisted keys
    const update = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });

    let data = await SchoolData.findOne({ owner: req.user._id });

    if (!data) {
      // Race condition safety: create if missing
      data = await SchoolData.create({ owner: req.user._id, ...update });
    } else {
      Object.assign(data, update);
      await data.save();
    }

    res.json({ success: true, message: 'Data saved successfully.' });
  } catch (err) {
    console.error('POST /data error:', err);
    res.status(500).json({ success: false, message: 'Failed to save data.' });
  }
});

module.exports = router;
