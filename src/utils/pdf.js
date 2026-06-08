const PDFDocument = require('pdfkit');

/**
 * Generate a sale invoice PDF and return as a buffer
 */
const generateInvoicePDF = (sale) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ===== HEADER =====
      doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
      doc.fontSize(10).font('Helvetica').text(`Invoice #: ${sale.invoiceNumber}`, { align: 'right' });
      doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}`, { align: 'right' });
      doc.moveDown(1);

      // ===== SHOP INFO =====
      doc.fontSize(16).font('Helvetica-Bold').text(sale.shopName || 'Shop Manager Pro');
      doc.fontSize(10).font('Helvetica').text(sale.shopAddress || '');
      doc.text(`GST No: ${sale.shopGSTIN || 'N/A'}`);
      doc.moveDown(1);

      // ===== CUSTOMER INFO =====
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica').text(sale.customerName || 'Walk-In Customer');
      if (sale.customerPhone) doc.text(`Phone: ${sale.customerPhone}`);
      if (sale.customerGSTIN) doc.text(`GSTIN: ${sale.customerGSTIN}`);
      doc.moveDown(1);

      // ===== TABLE HEADER =====
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('#', 50, tableTop);
      doc.text('Item', 70, tableTop);
      doc.text('Qty', 280, tableTop, { width: 50, align: 'center' });
      doc.text('Unit Price', 340, tableTop, { width: 80, align: 'right' });
      doc.text('Tax', 430, tableTop, { width: 50, align: 'right' });
      doc.text('Total', 490, tableTop, { width: 60, align: 'right' });

      doc.moveTo(50, doc.y + 5).lineTo(560, doc.y + 5).stroke();
      doc.moveDown(0.5);

      // ===== TABLE ROWS =====
      doc.font('Helvetica').fontSize(9);
      let rowIndex = 1;
      (sale.items || []).forEach((item) => {
        const y = doc.y;
        const itemName = `${item.productName}${item.variantLabel ? ' - ' + item.variantLabel : ''}${item.imei ? '\nIMEI: ' + item.imei : ''}`;
        doc.text(String(rowIndex++), 50, y);
        doc.text(itemName, 70, y, { width: 200 });
        doc.text(String(item.quantity), 280, y, { width: 50, align: 'center' });
        doc.text(`Rs ${item.unitPrice.toFixed(2)}`, 340, y, { width: 80, align: 'right' });
        doc.text(`Rs ${(item.taxAmount || 0).toFixed(2)}`, 430, y, { width: 50, align: 'right' });
        doc.text(`Rs ${item.totalPrice.toFixed(2)}`, 490, y, { width: 60, align: 'right' });
        doc.moveDown(0.8);
      });

      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.5);

      // ===== TOTALS =====
      const totalsX = 400;
      doc.font('Helvetica').fontSize(10);
      doc.text(`Sub Total:`, totalsX, doc.y, { continued: true });
      doc.text(`Rs ${(sale.subTotal || 0).toFixed(2)}`, { align: 'right' });

      if (sale.discountAmount > 0) {
        doc.text(`Discount:`, totalsX, doc.y, { continued: true });
        doc.text(`- Rs ${(sale.discountAmount || 0).toFixed(2)}`, { align: 'right' });
      }

      doc.text(`GST / Tax:`, totalsX, doc.y, { continued: true });
      doc.text(`Rs ${(sale.taxAmount || 0).toFixed(2)}`, { align: 'right' });

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`TOTAL:`, totalsX, doc.y, { continued: true });
      doc.text(`Rs ${(sale.totalAmount || 0).toFixed(2)}`, { align: 'right' });

      doc.moveDown(1.5);

      // ===== FOOTER =====
      doc.fontSize(9).font('Helvetica').fillColor('#888888')
        .text('Thank you for your business!', { align: 'center' });
      doc.text('This is a computer-generated invoice.', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
