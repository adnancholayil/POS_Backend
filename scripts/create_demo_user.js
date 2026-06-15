// create_demo_user.js – run once to insert a demo tenant with known shop code DEMO01
// Usage: `node scripts/create_demo_user.js`

require('dotenv').config({ path: '../.env' }); // Adjusted path to backend .env

const mongoose = require('mongoose');
const AuthService = require('../src/modules/auth/auth.service');
const Settings = require('../src/modules/setting/setting.model');
const User = require('../src/modules/user/user.model');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // Check if a demo user already exists
    const existing = await User.findOne({ email: 'admin@demo.com' });
    if (existing) {
      console.log('Demo user already exists – aborting.');
      process.exit(0);
    }

    // Register a new tenant (owner) – this will generate a random shopCode which we will overwrite
    const payload = {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: 'demo123', // plain‑text, will be hashed by register()
      phone: '0000000000',
      role: 'admin',
      shopName: 'Demo Shop',
    };
    const result = await AuthService.register(payload);
    console.log('✅ Tenant registered, userId:', result.userId);

    // Force the shopCode to the known value DEMO01
    await Settings.updateOne({ tenantId: result.userId }, { $set: { shopCode: 'DEMO01' } });
    console.log('✅ Shop code forced to DEMO01');

    console.log('Demo login credentials:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: demo123');
    console.log('  Shop Code: DEMO01');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating demo user:', err);
    process.exit(1);
  }
})();
