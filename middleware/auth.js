const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Express middleware.
 * Reads "Authorization: Bearer <token>", verifies, and sets req.user.
 * Protected routes simply do  router.get('/thing', protect, handler).
 */
async function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';

  /* ── extract token ── */
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];

  /* ── verify ── */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach a lean user object (no password) so every route handler can use it
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Role guard – use after protect().
 *   router.get('/admin-only', protect, requireRole('admin'), handler);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission.' });
    }
    next();
  };
}

module.exports = { protect, requireRole };
