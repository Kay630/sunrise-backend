const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/* ── helpers ─────────────────────────────────────────────── */
function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function sendToken(res, user, statusCode = 200) {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toJSON()          // password already stripped by model method
  });
}

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   Creates a new user.  Allowed only when the users collection
   is empty (initial admin seed) OR when the request carries a
   valid admin token (admin invites a teacher / staff member).
   ═══════════════════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    /* ── basic validation ── */
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    /* ── guard: only allow when no users exist OR caller is admin ── */
    const userCount = await User.countDocuments();
    const isFirstUser = (userCount === 0);

    if (!isFirstUser) {
      // Require a valid admin token for subsequent registrations
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ success: false, message: 'Only an admin can create new accounts.' });
      }
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const caller  = await User.findById(decoded.id);
        if (!caller || caller.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Only an admin can create new accounts.' });
        }
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
    }

    /* ── duplicate check ── */
    if (await User.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    /* ── create ── */
    const newUser = await User.create({
      name,
      email,
      password,
      role: isFirstUser ? 'admin' : (role || 'teacher')   // first user is always admin
    });

    sendToken(res, newUser, 201);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login
   ═══════════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendToken(res, user);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET  /api/auth/me   (protected)
   Returns the currently-authenticated user.
   ═══════════════════════════════════════════════════════════ */
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

/* ═══════════════════════════════════════════════════════════
   PUT  /api/auth/password   (protected)
   Changes the authenticated user's password.
   Body: { currentPassword, newPassword }
   ═══════════════════════════════════════════════════════════ */
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    // Re-fetch with password field (select was -password in protect)
    const user = await User.findById(req.user._id).select('+password');

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;       // pre-save hook re-hashes
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Server error while changing password.' });
  }
});

module.exports = router;
