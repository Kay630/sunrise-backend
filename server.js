require('dotenv').config();                  // must be before anything that reads process.env

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const morgan     = require('morgan');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

/* ─── app bootstrap ──────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── CORS ───────────────────────────────────────────────── */
/*
 * In production set FRONTEND_ORIGIN to the exact URL where the
 * school app is hosted (e.g. https://sunrise-school.vercel.app).
 * In development, '*' is fine for quick testing.
 */
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

/* ─── MongoDB connection → listen ────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✔  MongoDB connected');
    app.listen(PORT, () => console.log(`✔  Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
