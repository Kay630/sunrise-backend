const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/* ─── Schema ─────────────────────────────────────────────── */
const userSchema = new mongoose.Schema(
  {
    name:     { type: String,  required: true,  trim: true },
    email:    { type: String,  required: true,  unique: true, lowercase: true, trim: true },
    password: { type: String,  required: true,  minlength: 6 },
    role:     { type: String,  enum: ['admin', 'teacher', 'staff'], default: 'teacher' },
    status:   { type: String,  enum: ['Active', 'Inactive'],        default: 'Active' }
  },
  { timestamps: true }           // createdAt / updatedAt automatically
);

/* ─── Index ──────────────────────────────────────────────── */
userSchema.index({ email: 1 }, { unique: true });

/* ─── Pre-save hook – hash password only when it changed ── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ─── Instance method – compare plain text to stored hash ─ */
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/* ─── Strip password from every JSON response ────────────── */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
