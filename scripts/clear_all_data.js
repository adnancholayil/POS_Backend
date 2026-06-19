// clear_all_data.js - Clears all collections in the MongoDB database
// Usage: `node scripts/clear_all_data.js`

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not defined in .env');
      process.exit(1);
    }

    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const collections = await mongoose.connection.db.collections();
    console.log(`Found ${collections.length} collections. Clearing data...`);

    for (const collection of collections) {
      const name = collection.collectionName;
      
      // Skip system collections
      if (name.startsWith('system.')) {
        continue;
      }

      const result = await collection.deleteMany({});
      console.log(`🧹 Cleared collection: ${name} (${result.deletedCount} documents deleted)`);
    }

    console.log('\n🎉 All collections cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
})();
