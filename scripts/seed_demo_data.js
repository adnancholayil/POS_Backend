// seed_demo_data.js – seeds realistic test data for the DEMO01 tenant
// Usage: `node scripts/seed_demo_data.js`

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const AuthService = require('../src/modules/auth/auth.service');
const Settings = require('../src/modules/setting/setting.model');
const User = require('../src/modules/user/user.model');
const Role = require('../src/modules/role/role.model');
const Category = require('../src/modules/product/category.model');
const Brand = require('../src/modules/product/brand.model');
const Product = require('../src/modules/product/product.model');
const Inventory = require('../src/modules/inventory/inventory.model');
const InventoryMovement = require('../src/modules/inventory/inventoryMovement.model');
const Customer = require('../src/modules/customer/customer.model');
const Sale = require('../src/modules/sales/sale.model');
const SaleItem = require('../src/modules/sales/saleItem.model');
const Repair = require('../src/modules/repair/repair.model');
const UsedDevice = require('../src/modules/usedDevice/usedDevice.model');
const Attendance = require('../src/modules/attendance/attendance.model');
const Supplier = require('../src/modules/supplier/supplier.model');

// Helper to generate 15-digit IMEI
const generateImei = () => {
  let imei = '35' + Math.floor(1000000000000 + Math.random() * 9000000000000);
  return imei;
};

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // 1. Initial Seeding Setup of DEMO01 Tenant (Clean Slate for Users/Roles/Settings)
    let demoTenantId;
    const existingDemoSettings = await Settings.findOne({ shopCode: 'DEMO01' });
    if (existingDemoSettings) {
      demoTenantId = existingDemoSettings.tenantId;
      console.log('Cleaning up existing collections for tenantId:', demoTenantId);

      // Clean all collections associated with this tenantId
      await User.deleteMany({ tenantId: demoTenantId });
      await Role.deleteMany({ tenantId: demoTenantId });
      await Settings.deleteMany({ tenantId: demoTenantId });
      await Category.deleteMany({ tenantId: demoTenantId });
      await Brand.deleteMany({ tenantId: demoTenantId });
      await Product.deleteMany({ tenantId: demoTenantId });
      await Inventory.deleteMany({ tenantId: demoTenantId });
      await InventoryMovement.deleteMany({ tenantId: demoTenantId });
      await Customer.deleteMany({ tenantId: demoTenantId });
      await Sale.deleteMany({ tenantId: demoTenantId });
      await SaleItem.deleteMany({ tenantId: demoTenantId });
      await Repair.deleteMany({ tenantId: demoTenantId });
      await UsedDevice.deleteMany({ tenantId: demoTenantId });
      await Attendance.deleteMany({ tenantId: demoTenantId });
      await Supplier.deleteMany({ tenantId: demoTenantId });
      console.log('🧹 Cleaned up existing DEMO01 collections.');
    }

    // Clean up loose users with the demo emails
    await User.deleteMany({ email: { $in: ['admin@zylox.com', 'salesman@zylox.com', 'malhotra@zylox.com'] } });

    // 2. Register fresh DEMO01 Tenant
    console.log('Registering fresh demo tenant owner (admin)...');
    const adminPayload = {
      name: 'Demo Admin',
      email: 'admin@zylox.com',
      password: 'admin123',
      phone: '1234567890',
      shopName: 'Galaxy POS Demo',
    };
    const result = await AuthService.register(adminPayload);
    demoTenantId = result.userId;
    console.log('✅ Registered demo tenant, tenantId:', demoTenantId);

    // Force shopCode to DEMO01
    await Settings.updateOne({ tenantId: demoTenantId }, { $set: { shopCode: 'DEMO01' } });
    console.log('✅ Shop code forced to DEMO01');

    // Resolve Role IDs
    const adminRole = await Role.findOne({ name: 'admin', tenantId: demoTenantId });
    const salesmanRole = await Role.findOne({ name: 'salesman', tenantId: demoTenantId });
    const managerRole = await Role.findOne({ name: 'manager', tenantId: demoTenantId });

    // 3. Create fresh salesman and Malhotra technician
    console.log('Creating fresh demo staff users...');
    const salesmanUser = await User.create({
      name: 'Demo Salesman',
      email: 'salesman@zylox.com',
      password: 'sales123',
      role: salesmanRole._id,
      tenantId: demoTenantId,
      status: 'active',
      isEmailVerified: true,
    });
    console.log('   - Salesman user created (salesman@zylox.com / sales123)');

    const malhotraUser = await User.create({
      name: 'Malhotra Technician',
      email: 'malhotra@zylox.com',
      password: 'tech1234',
      role: managerRole ? managerRole._id : adminRole._id, // Assign Manager access
      tenantId: demoTenantId,
      status: 'active',
      isEmailVerified: true,
    });
    console.log('   - Malhotra Technician user created (malhotra@zylox.com / tech123)');

    // 4. Seed Brands
    console.log('Seeding brands...');
    const brandsData = [
      { name: 'Apple', description: 'Apple iOS Devices and Accessories' },
      { name: 'Samsung', description: 'Samsung Electronics and Galaxy Devices' },
      { name: 'OnePlus', description: 'OnePlus smartphones and accessories' },
      { name: 'HP', description: 'HP Laptops and Printers' },
      { name: 'Dell', description: 'Dell Computers and hardware solutions' },
      { name: 'Xiaomi', description: 'Xiaomi smartphones and IoT devices' },
    ];
    const brands = await Brand.insertMany(
      brandsData.map(b => ({ ...b, tenantId: demoTenantId }))
    );
    console.log(`✅ Seeded ${brands.length} Brands`);

    const brandMap = {};
    brands.forEach(b => { brandMap[b.name] = b._id; });

    // 5. Seed Categories
    console.log('Seeding categories...');
    const categoriesData = [
      { name: 'Smartphones', description: 'Cellular mobile phones and devices' },
      { name: 'Laptops', description: 'Portable notebooks and workstations' },
      { name: 'Accessories', description: 'Chargers, headphones, screen protectors, etc.' },
      { name: 'Spare Parts', description: 'Replacement displays, batteries, motherboard ICs' },
    ];
    const categories = await Category.insertMany(
      categoriesData.map(c => ({ ...c, tenantId: demoTenantId }))
    );
    console.log(`✅ Seeded ${categories.length} Categories`);

    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.name] = c._id; });

    // 6. Seed Products
    console.log('Seeding products...');
    const productsData = [
      {
        name: 'iPhone 14 Pro',
        sku: 'IPHONE14PRO',
        barcode: '190199000142',
        description: 'Flagship Apple iPhone with Dynamic Island and A16 Bionic.',
        category: categoryMap['Smartphones'],
        brand: brandMap['Apple'],
        productType: 'mobile',
        price: 120000,
        cost: 90000,
        hasIMEI: true,
        warrantyMonths: 12,
        taxRate: 18,
        variants: [
          { color: 'Space Black', storage: '256GB', ram: '6GB', sellingPrice: 120000, costPrice: 90000, sku: 'IP14P-SB-256' },
          { color: 'Deep Purple', storage: '256GB', ram: '6GB', sellingPrice: 120000, costPrice: 90000, sku: 'IP14P-DP-256' },
        ],
      },
      {
        name: 'Galaxy S23 Ultra',
        sku: 'GALS23ULTRA',
        barcode: '8806094770410',
        description: 'Premium Samsung device with 200MP Camera and built-in S Pen.',
        category: categoryMap['Smartphones'],
        brand: brandMap['Samsung'],
        productType: 'mobile',
        price: 115000,
        cost: 85000,
        hasIMEI: true,
        warrantyMonths: 12,
        taxRate: 18,
        variants: [
          { color: 'Phantom Black', storage: '512GB', ram: '12GB', sellingPrice: 115000, costPrice: 85000, sku: 'S23U-PB-512' },
          { color: 'Cream', storage: '256GB', ram: '8GB', sellingPrice: 105000, costPrice: 80000, sku: 'S23U-CR-256' },
        ],
      },
      {
        name: 'OnePlus 11',
        sku: 'ONEPLUS11',
        barcode: '6971597843210',
        description: 'Fast and smooth flagship with Hasselblad camera.',
        category: categoryMap['Smartphones'],
        brand: brandMap['OnePlus'],
        productType: 'mobile',
        price: 56999,
        cost: 45000,
        hasIMEI: true,
        warrantyMonths: 12,
        taxRate: 18,
        variants: [
          { color: 'Eternal Green', storage: '256GB', ram: '16GB', sellingPrice: 61999, costPrice: 48000, sku: 'OP11-EG-256' },
          { color: 'Titan Black', storage: '128GB', ram: '8GB', sellingPrice: 56999, costPrice: 45000, sku: 'OP11-TB-128' },
        ],
      },
      {
        name: 'HP Spectre x360',
        sku: 'HPSPECTRE360',
        barcode: '196188204123',
        description: 'High-end 2-in-1 convertible laptop with OLED touch screen.',
        category: categoryMap['Laptops'],
        brand: brandMap['HP'],
        productType: 'laptop',
        price: 145000,
        cost: 110000,
        hasIMEI: true, // laptops tracked by serial
        warrantyMonths: 24,
        taxRate: 18,
        variants: [],
      },
      {
        name: 'Dell XPS 15',
        sku: 'DELLXPS15',
        barcode: '5397184204123',
        description: 'Powerful laptop with InfinityEdge display and RTX GPU.',
        category: categoryMap['Laptops'],
        brand: brandMap['Dell'],
        productType: 'laptop',
        price: 175000,
        cost: 130000,
        hasIMEI: true, // laptops tracked by serial
        warrantyMonths: 24,
        taxRate: 18,
        variants: [],
      },
      {
        name: 'Anker PowerLine USB-C Cable',
        sku: 'ANKERCABLE',
        barcode: '848061051234',
        description: 'Durable double-braided nylon charging cable.',
        category: categoryMap['Accessories'],
        brand: brandMap['Xiaomi'],
        productType: 'accessory',
        price: 999,
        cost: 350,
        hasIMEI: false,
        warrantyMonths: 6,
        taxRate: 18,
        variants: [],
      },
      {
        name: 'iPhone 13 OLED Screen Replacement',
        sku: 'IP13SCREEN',
        barcode: '990001358941',
        description: 'Grade-A OEM compatible replacement screen assembly.',
        category: categoryMap['Spare Parts'],
        brand: brandMap['Apple'],
        productType: 'spare_part',
        price: 9500,
        cost: 4000,
        hasIMEI: false,
        warrantyMonths: 3,
        taxRate: 18,
        variants: [],
      },
    ];

    const products = [];
    for (const p of productsData) {
      const prod = await Product.create({ ...p, tenantId: demoTenantId });
      products.push(prod);
    }
    console.log(`✅ Seeded ${products.length} Products`);

    // 7. Seed Inventory & Stocks (with generated IMEIs for tracked products)
    console.log('Seeding stock inventories...');
    const inventoryList = [];
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        // Create inventory for each variant
        for (const v of p.variants) {
          const qty = 15;
          const imeiList = [];
          if (p.hasIMEI) {
            for (let i = 0; i < qty; i++) {
              imeiList.push(generateImei());
            }
          }
          const inv = await Inventory.create({
            product: p._id,
            variantId: v._id,
            imeiList: imeiList,
            quantity: qty,
            lowStockThreshold: 3,
            tenantId: demoTenantId,
          });
          inventoryList.push(inv);
        }
      } else {
        // Create base product inventory
        const qty = p.hasIMEI ? 8 : 45;
        const imeiList = [];
        if (p.hasIMEI) {
          for (let i = 0; i < qty; i++) {
            imeiList.push(generateImei());
          }
        }
        const inv = await Inventory.create({
          product: p._id,
          variantId: null,
          imeiList: imeiList,
          quantity: qty,
          lowStockThreshold: 5,
          tenantId: demoTenantId,
        });
        inventoryList.push(inv);
      }
    }
    console.log(`✅ Created stock inventory records (Total stocks setup: ${inventoryList.length})`);

    // 8. Seed Customers
    console.log('Seeding customers...');
    const customersData = [
      { name: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@gmail.com', address: '123 Main St, Mumbai', totalPurchases: 2, totalSpent: 120999 },
      { name: 'Sunita Sharma', phone: '9812345678', email: 'sunita@yahoo.com', address: '456 Park Rd, Delhi', totalPurchases: 1, totalSpent: 999 },
      { name: 'Amit Patel', phone: '9922334455', email: 'amit@outlook.com', address: '789 Lake View, Ahmedabad', totalPurchases: 3, totalSpent: 290999 },
      { name: 'Priya Singh', phone: '9765432109', email: 'priya@gmail.com', address: '321 High St, Bangalore', totalPurchases: 1, totalSpent: 56999 },
      { name: 'Rajesh Malhotra', phone: '9555667788', email: 'rajesh@malhotra.com', address: 'Sector 15, Chandigarh', totalPurchases: 0, totalSpent: 0 },
    ];
    const customers = await Customer.insertMany(
      customersData.map(c => ({ ...c, tenantId: demoTenantId }))
    );
    console.log(`✅ Seeded ${customers.length} Customers`);

    // 9. Seed Suppliers
    console.log('Seeding suppliers...');
    const suppliersData = [
      { name: 'Apex Mobile Distributors', contactPerson: 'Mohan Lal', phone: '9898989898', email: 'mohan@apex.com', address: 'Karol Bagh, Delhi', gstin: '07AAAAA1111A1Z1' },
      { name: 'Precision Spare Parts Ltd', contactPerson: 'Jane Smith', phone: '9090909090', email: 'sales@precisionparts.com', address: 'Electronic City, Bangalore', gstin: '29BBBBB2222B2Z2' },
      { name: 'Global Tech Wholesalers', contactPerson: 'David Lee', phone: '8080808080', email: 'david@globaltech.com', address: 'Nehru Place, Delhi', gstin: '07CCCCC3333C3Z3' },
    ];
    const suppliers = await Supplier.insertMany(
      suppliersData.map(s => ({ ...s, tenantId: demoTenantId }))
    );
    console.log(`✅ Seeded ${suppliers.length} Suppliers`);

    // 10. Seed Sales & Invoices over the last 30 days
    console.log('Generating realistic historical sales transactions (30 days range)...');
    const salesList = [];
    const salesItemsList = [];

    // Helper to pick items and create sales
    const baseDate = new Date();
    // Generate 12 historical sales
    for (let index = 0; index < 12; index++) {
      const saleDate = new Date(baseDate.getTime() - (12 - index) * 2.5 * 24 * 60 * 60 * 1000); // spread dates
      const customer = customers[index % customers.length];
      const invoiceNum = `INV-DEMO-${1000 + index}`;

      // Pick 1-2 products
      const selectedProducts = [
        products[index % products.length],
        products[(index + 3) % products.length]
      ];

      let subTotal = 0;
      let taxAmount = 0;
      let totalAmount = 0;
      const saleItemsToCreate = [];

      for (const prod of selectedProducts) {
        let variantId = null;
        let variantLabel = '';
        let itemPrice = prod.price;
        let itemCost = prod.cost;
        let itemSku = prod.sku;

        if (prod.variants && prod.variants.length > 0) {
          const variant = prod.variants[index % prod.variants.length];
          variantId = variant._id;
          variantLabel = `${variant.color} ${variant.storage}`;
          itemPrice = variant.sellingPrice;
          itemCost = variant.costPrice;
          itemSku = variant.sku;
        }

        // Check stock inventory to fetch matching IMEI if IMEI is enabled
        const matchedInv = await Inventory.findOne({ product: prod._id, variantId, tenantId: demoTenantId });
        let imeiSelected = '';
        if (prod.hasIMEI && matchedInv && matchedInv.imeiList.length > 0) {
          // Take the first IMEI and remove it from inventory
          imeiSelected = matchedInv.imeiList.shift();
          matchedInv.quantity = matchedInv.imeiList.length;
          await matchedInv.save();
        }

        const qty = 1;
        const linePrice = itemPrice * qty;
        const lineTax = Math.round(linePrice * 0.18); // 18% GST

        saleItemsToCreate.push({
          product: prod._id,
          productName: prod.name,
          variantId,
          variantLabel,
          imei: imeiSelected,
          quantity: qty,
          costPrice: itemCost,
          unitPrice: itemPrice,
          taxRate: 18,
          taxAmount: lineTax,
          totalPrice: linePrice + lineTax,
          tenantId: demoTenantId,
          createdAt: saleDate,
        });

        subTotal += linePrice;
        taxAmount += lineTax;
      }

      const discount = index % 4 === 0 ? 500 : 0;
      totalAmount = subTotal + taxAmount - discount;

      const sale = await Sale.create({
        invoiceNumber: invoiceNum,
        customer: customer._id,
        customerName: customer.name,
        salesman: salesmanUser._id,
        paymentMethod: index % 3 === 0 ? 'upi' : index % 3 === 1 ? 'card' : 'cash',
        paymentStatus: 'paid',
        subTotal,
        discountAmount: discount,
        taxAmount,
        totalAmount,
        paidAmount: totalAmount,
        status: 'completed',
        isGSTInvoice: true,
        tenantId: demoTenantId,
        createdAt: saleDate,
      });

      // Save sale items linking to sale ID
      for (const item of saleItemsToCreate) {
        item.sale = sale._id;
        await SaleItem.create(item);
      }
      salesList.push(sale);
    }
    console.log(`✅ Generated ${salesList.length} Sales and invoices records with dynamic dates`);

    // 11. Seed Repairs
    console.log('Seeding service repair tickets...');
    const repairTickets = [
      {
        ticketNumber: 'TK-DEMO-1001',
        customer: customers[0]._id,
        deviceType: 'mobile',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 13 Pro',
        serialOrImei: '358992104481023',
        issueDescription: 'Out of warranty display replacement. Backlight screen flickering.',
        accessoriesReceived: ['Device Case'],
        deviceCondition: 'Scratches on sides, display intact but flickering',
        estimatedCost: 8500,
        actualCost: 0,
        advancePaid: 2000,
        status: 'pending',
        priority: 'high',
        assignedTechnician: malhotraUser._id,
        tenantId: demoTenantId,
      },
      {
        ticketNumber: 'TK-DEMO-1002',
        customer: customers[1]._id,
        deviceType: 'mobile',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S22',
        serialOrImei: '358992104481541',
        issueDescription: 'Battery swelling and quick discharge. Back cover slightly popped open.',
        accessoriesReceived: [],
        deviceCondition: 'Back cover bulging',
        estimatedCost: 3200,
        actualCost: 0,
        advancePaid: 0,
        status: 'diagnosing',
        priority: 'normal',
        assignedTechnician: malhotraUser._id,
        tenantId: demoTenantId,
      },
      {
        ticketNumber: 'TK-DEMO-1003',
        customer: customers[2]._id,
        deviceType: 'mobile',
        deviceBrand: 'OnePlus',
        deviceModel: 'OnePlus 10 Pro',
        serialOrImei: '358992104481992',
        issueDescription: 'Water spill damage. Device bootlooping and failing to charge.',
        accessoriesReceived: ['Original Charger Box'],
        deviceCondition: 'Water indicator triggered pink',
        estimatedCost: 11500,
        actualCost: 0,
        advancePaid: 3000,
        status: 'repairing',
        priority: 'urgent',
        assignedTechnician: malhotraUser._id,
        tenantId: demoTenantId,
      },
      {
        ticketNumber: 'TK-DEMO-1004',
        customer: customers[3]._id,
        deviceType: 'laptop',
        deviceBrand: 'Apple',
        deviceModel: 'MacBook Air M1',
        serialOrImei: 'C02F1234Q05D',
        issueDescription: 'Several sticky keys on the keyboard layout (spacebar, shift). No liquid spill.',
        accessoriesReceived: ['Laptop Sleeve'],
        deviceCondition: 'Good condition',
        estimatedCost: 14000,
        actualCost: 14000,
        advancePaid: 5000,
        status: 'ready',
        priority: 'normal',
        assignedTechnician: adminPayload._id, // Owner assigned
        tenantId: demoTenantId,
      },
      {
        ticketNumber: 'TK-DEMO-1005',
        customer: customers[4]._id,
        deviceType: 'laptop',
        deviceBrand: 'HP',
        deviceModel: 'HP Pavilion 15',
        serialOrImei: 'CND54321A89',
        issueDescription: 'Windows operating system corrupted. Needs fresh installation and interior dust extraction.',
        accessoriesReceived: ['Charging Adapter'],
        deviceCondition: 'Dusty fans',
        estimatedCost: 4500,
        actualCost: 4500,
        advancePaid: 4500,
        status: 'delivered',
        priority: 'low',
        deliveredAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        assignedTechnician: malhotraUser._id,
        tenantId: demoTenantId,
      },
    ];

    for (const r of repairTickets) {
      await Repair.create(r);
    }
    console.log(`✅ Seeded ${repairTickets.length} Repair Jobs`);

    // 12. Seed Pre-owned Devices (Trade-Ins / Second Hand)
    console.log('Seeding pre-owned secondhand trade-in inventory...');
    const preOwnedDevices = [
      {
        deviceType: 'mobile',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 11',
        serialOrImei: '358992104481234',
        color: 'Product Red',
        storage: '128GB',
        ram: '4GB',
        condition: 'good',
        evaluationNotes: 'Battery health 82%, minor screen scratches, fully responsive buttons.',
        sourcedFrom: customers[0]._id,
        sourcedFromName: customers[0].name,
        buyingPrice: 15000,
        sellingPrice: 22000,
        status: 'ready_for_sale',
        tenantId: demoTenantId,
      },
      {
        deviceType: 'mobile',
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy Note 20 Ultra',
        serialOrImei: '358992104485678',
        color: 'Mystic Bronze',
        storage: '256GB',
        ram: '12GB',
        condition: 'fair',
        evaluationNotes: 'Minor glass hairline crack on bottom-right back glass. S-Pen and camera fully functional.',
        sourcedFrom: customers[1]._id,
        sourcedFromName: customers[1].name,
        buyingPrice: 18000,
        sellingPrice: 28000,
        status: 'refurbishing',
        tenantId: demoTenantId,
      },
      {
        deviceType: 'mobile',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone XR',
        serialOrImei: '358992104489012',
        color: 'Yellow',
        storage: '64GB',
        ram: '3GB',
        condition: 'excellent',
        evaluationNotes: 'Like-new condition. 90% Battery capacity. Re-housed in clean chassis.',
        sourcedFrom: customers[3]._id,
        sourcedFromName: customers[3].name,
        buyingPrice: 10000,
        sellingPrice: 16500,
        status: 'sold',
        soldTo: customers[4]._id,
        soldAt: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        tenantId: demoTenantId,
      },
    ];

    for (const d of preOwnedDevices) {
      await UsedDevice.create(d);
    }
    console.log(`✅ Seeded ${preOwnedDevices.length} Pre-owned devices catalog`);

    // 13. Seed Attendance Shifts
    console.log('Seeding shift attendance registry for last 7 days...');
    const usersList = [
      { id: demoTenantId, name: 'Demo Admin' },
      { id: salesmanUser._id, name: 'Demo Salesman' },
      { id: malhotraUser._id, name: 'Malhotra Tech' },
    ];

    for (const u of usersList) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        // Skip Sundays (offsets 1 and 8 skip check if it matches)
        const dateObj = new Date(baseDate.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        if (dateObj.getDay() === 0) continue; // Skip Sunday shifts

        const dateStr = dateObj.toISOString().split('T')[0];
        const checkInTime = new Date(dateObj);
        checkInTime.setHours(9, Math.floor(Math.random() * 15), 0, 0); // 9:00 - 9:15 AM

        const checkOutTime = new Date(dateObj);
        checkOutTime.setHours(18, Math.floor(Math.random() * 20), 0, 0); // 6:00 - 6:20 PM

        const hours = parseFloat(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2));

        await Attendance.create({
          user: u.id,
          date: dateStr,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: 'present',
          workingHours: hours,
          notes: 'Standard logged shift',
          markedBy: demoTenantId, // marked by admin
          tenantId: demoTenantId,
        });
      }
    }
    console.log('✅ Logged attendance shift records successfully');

    console.log('\n🎉 DEMO ENVIRONMENT DATA SEEDED WITH REALISTIC TEST RECORDS!');
    console.log('------------------------------------------------------------');
    console.log(`Tenant Shop Code : DEMO01`);
    console.log(`Created Brands   : ${brands.length} items`);
    console.log(`Created Products : ${products.length} items`);
    console.log(`Sales & Invoices : ${salesList.length} items (last 30 days distribution)`);
    console.log(`Repair Tickets   : ${repairTickets.length} active service center jobs`);
    console.log(`Trade-In Devices : ${preOwnedDevices.length} devices in catalog`);
    console.log(`Staff Members    : 3 active accounts`);
    console.log('------------------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo database:', err);
    process.exit(1);
  }
})();
