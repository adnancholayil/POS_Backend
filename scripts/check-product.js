const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const Product = require('../src/modules/product/product.model');
  const Inventory = require('../src/modules/inventory/inventory.model');
  
  const product = await Product.findOne({ barcode: '002160' });
  if (!product) {
    console.log('Product not found with barcode 002160');
  } else {
    console.log('Product found:', product.name, 'ID:', product._id);
    const inv = await Inventory.findOne({ product: product._id });
    if (inv) {
      console.log('Inventory quantity:', inv.quantity);
      if (inv.quantity === 0) {
        inv.quantity = 1000;
        await inv.save();
        console.log('Updated inventory quantity to 1000');
      }
    } else {
      console.log('No inventory record found, creating one...');
      await Inventory.create({
        product: product._id,
        quantity: 1000,
        lowStockThreshold: 5,
        tenantId: product.tenantId
      });
      console.log('Created inventory record with 1000 stock');
    }
  }
  
  await mongoose.disconnect();
  console.log('Disconnected');
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
