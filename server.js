require('dotenv').config();                  // must be before anything that reads process.env

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const morgan     = require('morgan');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const User       = require('./models/User');

/* ─── app bootstrap ──────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── CORS ───────────────────────────────────────────────── */
/*
 * Allow requests from:
 * - Production frontend (FRONTEND_ORIGIN env var)
 * - Local file testing (file://)
 * - Localhost testing (http://localhost)
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow production frontend
    if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) {
      return callback(null, true);
    }
    
    // Allow localhost and file:// for testing
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('file://') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('https://localhost')) {
      return callback(null, true);
    }
    
    // If no FRONTEND_ORIGIN is set, allow all origins (development mode)
    if (!process.env.FRONTEND_ORIGIN) {
      return callback(null, true);
    }
    
    // Otherwise, deny
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

/* ─── body parsing ───────────────────────────────────────── */
app.use(express.json());

/* ─── logging ────────────────────────────────────────────── */
app.use(morgan('dev'));                      // colour-coded, concise

/* ─── routes ─────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);            // register / login / me / password
app.use('/api/data', dataRoutes);            // GET & POST full school data

/* ─── health check (Render / uptime monitors) ────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── 404 catch-all ──────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

/* ─── global error handler ───────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

/* ─── Auto-seed admin account on first startup ────────────── */
async function seedAdminIfNeeded() {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      console.log(`ℹ  ${count} user(s) already exist — skipping seed.`);
      return;
    }

    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
      console.warn('⚠  ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME not set — skipping admin seed.');
      return;
    }

    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
      status:   'Active'
    });

    console.log(`✅  Admin account created: ${ADMIN_EMAIL}`);
    console.log('⚠   Change the password immediately after your first login.');
  } catch (err) {
    console.error('❌  Admin seed failed:', err.message);
  }
}

/* ─── MongoDB connection → seed → listen ────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✔  MongoDB connected');
    
    // Auto-seed admin account if needed
    await seedAdminIfNeeded();
    
    app.listen(PORT, () => console.log(`✔  Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
