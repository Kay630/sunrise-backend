/**
 * seedAdmin.js
 * ──────────────
 * Run once after deploying for the first time:
 *     node seedAdmin.js
 *
 * Creates the initial admin account from .env variables.
 * Safe to run again — it is a no-op if any user already exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✔  Connected to MongoDB');

  const count = await User.countDocuments();
  if (count > 0) {
    console.log(`ℹ  ${count} user(s) already exist — skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.error('❌  ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set in .env');
    await mongoose.disconnect();
    process.exit(1);
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
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
