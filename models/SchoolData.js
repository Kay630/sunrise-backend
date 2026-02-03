const mongoose = require('mongoose');

/*
 * One document holds the entire school dataset for a given admin user.
 * The front-end already owns the shape of every sub-collection; we use
 * Schema.Types.Mixed so Mongoose doesn't validate or strip unknown keys.
 *
 * Fetched with   GET  /api/data          → returns the whole blob
 * Replaced with  POST /api/data          → body IS the blob
 *
 * This mirrors how the current localStorage payload works, so the
 * front-end needs zero refactoring of its internal data structures.
 */

const dataSchema = new mongoose.Schema(
  {
    owner: {                         // FK → User._id  (the admin who owns this data)
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true,
      unique: true                   // one data-doc per user
    },

    /* ── collections ── */
    users:           { type: mongoose.Schema.Types.Mixed, default: [] },
    students:        { type: mongoose.Schema.Types.Mixed, default: [] },
    teachers:        { type: mongoose.Schema.Types.Mixed, default: [] },
    payments:        { type: mongoose.Schema.Types.Mixed, default: [] },
    expenses:        { type: mongoose.Schema.Types.Mixed, default: [] },
    grades:          { type: mongoose.Schema.Types.Mixed, default: [] },
    reports:         { type: mongoose.Schema.Types.Mixed, default: [] },
    messages:        { type: mongoose.Schema.Types.Mixed, default: [] },
    attendance:      { type: mongoose.Schema.Types.Mixed, default: [] },

    /* ── auto-ID counters ── */
    studentCounters: { type: mongoose.Schema.Types.Mixed, default: {} },
    teacherCounter:  { type: Number, default: 1 },
    receiptCounter:  { type: Number, default: 1 },
    expenseCounter:  { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchoolData', dataSchema);
