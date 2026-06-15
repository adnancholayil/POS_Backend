// create_demo_user.js – run once to insert a demo tenant with known shop code DEMO01
// Usage: `node scripts/create_demo_user.js`

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const AuthService = require('../src/modules/auth/auth.service');
const Settings = require('../src/modules/setting/setting.model');
const User = require('../src/modules/user/user.model');
const Role = require('../src/modules/role/role.model');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // 1. Find existing demo tenant if any
    const existingDemoSettings = await Settings.findOne({ shopCode: 'DEMO01' });
    if (existingDemoSettings) {
      console.log('Found existing DEMO01 tenant:', existingDemoSettings.tenantId);
      const demoTenantId = existingDemoSettings.tenantId;

      // Clean up users, roles, and settings for a clean slate
      await User.deleteMany({ tenantId: demoTenantId });
      await Role.deleteMany({ tenantId: demoTenantId });
      await Settings.deleteMany({ tenantId: demoTenantId });
      console.log('🧹 Cleaned up existing DEMO01 users, roles, and settings.');
    }

    // Also clean up any loose users/settings with the demo emails just in case
    await User.deleteMany({ email: { $in: ['admin@zylox.com', 'salesman@zylox.com', 'admin@demo.com'] }, tenantId: { $exists: true } });

    // 2. Register the new demo admin tenant
    console.log('Registering demo tenant owner (admin)...');
    const adminPayload = {
      name: 'Demo Admin',
      email: 'admin@zylox.com',
      password: 'admin123',
      phone: '1234567890',
      shopName: 'Galaxy POS Demo',
    };
    const result = await AuthService.register(adminPayload);
    const demoTenantId = result.userId;
    console.log('✅ Demo tenant registered, tenantId:', demoTenantId);

    // 3. Force the shopCode to DEMO01
    await Settings.updateOne({ tenantId: demoTenantId }, { $set: { shopCode: 'DEMO01' } });
    console.log('✅ Shop code forced to DEMO01');

    // 4. Create the salesman user under the same tenant
    console.log('Creating demo salesman user...');
    // Find the salesman role created for this tenant
    const salesmanRole = await Role.findOne({ name: 'salesman', tenantId: demoTenantId });
    if (!salesmanRole) {
      throw new Error('Could not find salesman role created for the new tenant');
    }

    const salesmanUser = await User.create({
      name: 'Demo Salesman',
      email: 'salesman@zylox.com',
      password: 'sales123', // Will be hashed by pre-save middleware
      role: salesmanRole._id,
      tenantId: demoTenantId,
      status: 'active',
      isEmailVerified: true,
    });
    console.log('✅ Salesman user created, userId:', salesmanUser._id);

    console.log('\n🎉 Demo Environment Seeded Successfully!');
    console.log('Shop Code: DEMO01');
    console.log('1. Admin Login:');
    console.log('   Email:    admin@zylox.com');
    console.log('   Password: admin123');
    console.log('2. Salesman Login:');
    console.log('   Email:    salesman@zylox.com');
    console.log('   Password: sales123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo environment:', err);
    process.exit(1);
  }
})();
