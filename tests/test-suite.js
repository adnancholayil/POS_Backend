const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { initSocket } = require('../src/config/socket');
const logger = require('../src/config/logger');
require('dotenv').config();

const PORT = 5050;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Models to clean up
const User = require('../src/modules/user/user.model');
const Role = require('../src/modules/role/role.model');
const Permission = require('../src/modules/role/permission.model');
const Product = require('../src/modules/product/product.model');
const Category = require('../src/modules/product/category.model');
const Brand = require('../src/modules/product/brand.model');
const Inventory = require('../src/modules/inventory/inventory.model');
const InventoryMovement = require('../src/modules/inventory/inventoryMovement.model');
const Customer = require('../src/modules/customer/customer.model');
const Sale = require('../src/modules/sales/sale.model');
const SaleItem = require('../src/modules/sales/saleItem.model');
const Warranty = require('../src/modules/sales/warranty.model');
const Settings = require('../src/modules/setting/setting.model');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  logger.info('Starting integration test suite...');
  
  // Connect to DB
  await connectDB();

  // Clean up any leftover records from prior failed runs
  try {
    const testUsers = await User.find({ email: /test_owner_/ });
    const testTenantIds = testUsers.map(u => u.tenantId);
    if (testTenantIds.length > 0) {
      await Promise.all([
        User.deleteMany({ tenantId: { $in: testTenantIds } }),
        Role.deleteMany({ tenantId: { $in: testTenantIds } }),
        Product.deleteMany({ tenantId: { $in: testTenantIds } }),
        Category.deleteMany({ tenantId: { $in: testTenantIds } }),
        Brand.deleteMany({ tenantId: { $in: testTenantIds } }),
        Inventory.deleteMany({ tenantId: { $in: testTenantIds } }),
        InventoryMovement.deleteMany({ tenantId: { $in: testTenantIds } }),
        Customer.deleteMany({ tenantId: { $in: testTenantIds } }),
        Sale.deleteMany({ tenantId: { $in: testTenantIds } }),
        SaleItem.deleteMany({ tenantId: { $in: testTenantIds } }),
        Warranty.deleteMany({ tenantId: { $in: testTenantIds } }),
        Settings.deleteMany({ tenantId: { $in: testTenantIds } }),
      ]);
      logger.info(`Cleaned up ${testTenantIds.length} leftover test tenants from previous runs.`);
    }
  } catch (cleanupError) {
    logger.error(`Error during initial cleanup: ${cleanupError.message}`);
  }

  // Create HTTP Server
  const server = http.createServer(app);
  initSocket(server);
  
  await new Promise((resolve) => server.listen(PORT, resolve));
  logger.info(`Test server listening on port ${PORT}`);

  const testEmail = `test_owner_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const shopName = 'Integration Test Shop Inc.';
  let accessToken = '';
  let tenantId = '';
  let userId = '';

  try {
    // ─── 1. REGISTER OWNER & CREATE TENANT ────────────────────────────────────
    logger.info('Test 1: Registering new owner user...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin Owner',
        email: testEmail,
        password: testPassword,
        shopName,
      }),
    });
    const regJson = await regRes.json();
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regJson)}`);
    }
    userId = regJson.data.userId;
    logger.info(`User registered successfully. ID: ${userId}`);

    // Retrieve verification token directly from DB
    const createdUser = await User.findById(userId).select('+emailVerificationToken');
    if (!createdUser) throw new Error('User not saved in DB!');
    const verifyToken = createdUser.emailVerificationToken;
    tenantId = createdUser.tenantId.toString();
    logger.info(`Verification token retrieved: ${verifyToken}. Tenant ID: ${tenantId}`);

    // ─── 2. VERIFY EMAIL ──────────────────────────────────────────────────────
    logger.info('Test 2: Verifying email...');
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-email?token=${verifyToken}`);
    if (verifyRes.status !== 200) {
      throw new Error(`Email verification failed: ${await verifyRes.text()}`);
    }
    logger.info('Email verified successfully.');

    // ─── 3. LOGIN OWNER ───────────────────────────────────────────────────────
    logger.info('Test 3: Logging in admin owner...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        tenantId,
      }),
    });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }
    accessToken = loginJson.data.accessToken;
    logger.info('Admin owner logged in successfully.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    // ─── 4. CREATE CATEGORY & BRAND ──────────────────────────────────────────
    logger.info('Test 4: Creating product categories and brands...');
    const catRes = await fetch(`${BASE_URL}/products/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Smartphones', description: 'Handheld cellular devices' }),
    });
    const catJson = await catRes.json();
    if (catRes.status !== 201) throw new Error(`Category creation failed: ${JSON.stringify(catJson)}`);
    const categoryId = catJson.data._id;

    const brandRes = await fetch(`${BASE_URL}/products/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Pineapple', description: 'Luxury gadgets' }),
    });
    const brandJson = await brandRes.json();
    if (brandRes.status !== 201) throw new Error(`Brand creation failed: ${JSON.stringify(brandJson)}`);
    const brandId = brandJson.data._id;
    logger.info('Category and Brand created successfully.');

    // ─── 5. CREATE PRODUCT WITH VARIANT ───────────────────────────────────────
    logger.info('Test 5: Creating product with price variants...');
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Pineapple Phone 15',
        sku: 'PNPL-15-BLK',
        barcode: '123456789012',
        description: 'New Pineapple phone',
        category: categoryId,
        brand: brandId,
        productType: 'mobile',
        hasIMEI: true,
        warrantyMonths: 12,
        variants: [{
          color: 'Black',
          storage: '128GB',
          ram: '8GB',
          sellingPrice: 799,
          costPrice: 500,
          sku: 'PNPL-15-BLK-VAR',
        }],
      }),
    });
    const prodJson = await prodRes.json();
    if (prodRes.status !== 201) throw new Error(`Product creation failed: ${JSON.stringify(prodJson)}`);
    const productId = prodJson.data._id;
    const variantId = prodJson.data.variants[0]._id;
    logger.info(`Product created successfully. ID: ${productId}, Variant ID: ${variantId}`);

    // ─── 6. STOCK-IN PRODUCT TO INVENTORY ─────────────────────────────────────
    logger.info('Test 6: Stocking-in product units...');
    const stockRes = await fetch(`${BASE_URL}/inventory/stock-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId,
        variantId,
        quantity: 10,
        reason: 'Initial PO Import',
        imeiList: ['IMEI001', 'IMEI002', 'IMEI003', 'IMEI004', 'IMEI005'],
      }),
    });
    const stockJson = await stockRes.json();
    if (stockRes.status !== 200) throw new Error(`Stock-in failed: ${JSON.stringify(stockJson)}`);
    logger.info('Stock-in successful.');

    // ─── 7. CREATE CUSTOMER ───────────────────────────────────────────────────
    logger.info('Test 7: Creating new customer...');
    const custRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'John Doe',
        phone: `+1555019${Date.now().toString().slice(-4)}`,
        email: 'john.doe@example.com',
        address: '123 Main St, Tech City',
      }),
    });
    const custJson = await custRes.json();
    if (custRes.status !== 201) throw new Error(`Customer creation failed: ${JSON.stringify(custJson)}`);
    const customerId = custJson.data._id;
    logger.info(`Customer created successfully. ID: ${customerId}`);

    // Update invoice prefix to avoid index collision with existing INV0001
    await Settings.updateOne({ tenantId }, { invoicePrefix: `T${Date.now().toString().slice(-3)}` });

    // ─── 8. SALES CHECKOUT (GST + PDF GENERATION) ─────────────────────────────
    logger.info('Test 8: Performing sales checkout...');
    const checkoutRes = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId,
        customerName: 'John Doe',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        discountAmount: 10,
        isGSTInvoice: true,
        items: [{
          productId,
          productName: 'Pineapple Phone 15',
          variantId,
          variantLabel: 'Black 8GB 128GB',
          imei: 'IMEI001',
          quantity: 1,
          costPrice: 500,
          unitPrice: 799,
          taxRate: 18,
          discountAmount: 5,
        }],
      }),
    });
    const checkoutJson = await checkoutRes.json();
    if (checkoutRes.status !== 201) throw new Error(`Checkout failed: ${JSON.stringify(checkoutJson)}`);
    const saleId = checkoutJson.data.sale._id;
    const invoiceNumber = checkoutJson.data.invoiceNumber;
    logger.info(`Checkout successful. Sale ID: ${saleId}, Invoice Number: ${invoiceNumber}`);

    // Verify invoice PDF link / streaming works
    const invoiceRes = await fetch(`${BASE_URL}/sales/${saleId}/invoice`, { headers });
    if (invoiceRes.status !== 200 || invoiceRes.headers.get('content-type') !== 'application/pdf') {
      throw new Error('Invoice PDF streaming is not working or content-type is invalid.');
    }
    logger.info('Invoice PDF retrieved successfully.');

    // ─── 9. REPORTS VALUATION & OVERVIEW ──────────────────────────────────────
    logger.info('Test 9: Verifying Reports Dashboard output...');
    const reportRes = await fetch(`${BASE_URL}/reports/overview`, { headers });
    const reportJson = await reportRes.json();
    if (reportRes.status !== 200) throw new Error(`Reports overview failed: ${JSON.stringify(reportJson)}`);
    logger.info(`Reports stats: ${JSON.stringify(reportJson.data)}`);

    // ─── 10. CLEANUP TEST DATA ────────────────────────────────────────────────
    logger.info('Test 10: Cleaning up integration test records...');
    await Promise.all([
      User.deleteMany({ tenantId }),
      Role.deleteMany({ tenantId }),
      Product.deleteMany({ tenantId }),
      Category.deleteMany({ tenantId }),
      Brand.deleteMany({ tenantId }),
      Inventory.deleteMany({ tenantId }),
      InventoryMovement.deleteMany({ tenantId }),
      Customer.deleteMany({ tenantId }),
      Sale.deleteMany({ tenantId }),
      SaleItem.deleteMany({ tenantId }),
      Warranty.deleteMany({ tenantId }),
      Settings.deleteMany({ tenantId }),
    ]);
    logger.info('Test database records cleaned up successfully.');

    logger.info('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');

  } catch (error) {
    logger.error(`--- TEST SUITE FAILED: ${error.message} ---`);
    console.error(error);
  } finally {
    // Shut down server
    server.close();
    await mongoose.connection.close();
    logger.info('Test server shut down. Mongoose disconnected.');
  }
}

runTests();
