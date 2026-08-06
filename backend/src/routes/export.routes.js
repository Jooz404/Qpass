const router = require('express').Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/export/feedback/excel
router.get('/feedback/excel', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { startDate, endDate, status, spbuId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (spbuId) where.spbuId = parseInt(spbuId);
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.submittedAt.lt = end;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        lo: { include: { spbu: true, truck: true, amt: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Q-Pass Bitung';
    const sheet = workbook.addWorksheet('Feedback Report');

    // Header styling
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'date', width: 18 },
      { header: 'No. LO', key: 'noLO', width: 20 },
      { header: 'SPBU', key: 'spbu', width: 25 },
      { header: 'Produk', key: 'product', width: 15 },
      { header: 'Nopol', key: 'nopol', width: 12 },
      { header: 'AMT', key: 'amt', width: 20 },
      { header: 'Segel', key: 'segel', width: 10 },
      { header: 'Volume', key: 'volume', width: 12 },
      { header: 'Selisih (L)', key: 'selisih', width: 12 },
      { header: 'Visual', key: 'visual', width: 15 },
      { header: 'Densitas', key: 'densitas', width: 12 },
      { header: 'Rating', key: 'rating', width: 8 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Catatan', key: 'notes', width: 30 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE30613' } };

    feedbacks.forEach((f, i) => {
      sheet.addRow({
        no: i + 1,
        date: new Date(f.submittedAt).toLocaleString('id-ID'),
        noLO: f.lo.noLO,
        spbu: `${f.lo.spbu.name} (${f.lo.spbu.code})`,
        product: f.lo.product,
        nopol: f.lo.truck.nopol,
        amt: f.lo.amt.name,
        segel: f.sealCondition,
        volume: f.volumeStatus,
        selisih: f.volumeDiff || '-',
        visual: f.visualCondition.replace('_', ' '),
        densitas: f.density,
        rating: `${f.rating}/5`,
        status: f.status,
        notes: f.notes || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=QPass_Feedback_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Export gagal' });
  }
});

// GET /api/export/feedback/pdf
router.get('/feedback/pdf', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const { startDate, endDate, status, spbuId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (spbuId) where.spbuId = parseInt(spbuId);
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.submittedAt.lt = end;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: { lo: { include: { spbu: true, truck: true, amt: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=QPass_Report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).fillColor('#E30613').text('Q-PASS BITUNG', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Quality & Quantity Assurance Testimonial System', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text(`Laporan Feedback - ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' });
    doc.moveDown(1);

    // Summary
    const total = feedbacks.length;
    const highPriority = feedbacks.filter(f => f.status === 'HIGH_PRIORITY').length;
    const avgRating = total > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : 0;

    doc.fontSize(10).fillColor('#333');
    doc.text(`Total Feedback: ${total}  |  High Priority: ${highPriority}  |  Avg Rating: ${avgRating}/5`);
    doc.moveDown(0.5);

    // Table
    const tableTop = doc.y;
    const headers = ['No', 'Tanggal', 'No. LO', 'SPBU', 'Produk', 'Segel', 'Volume', 'Visual', 'Densitas', 'Rating', 'Status'];
    const colWidths = [25, 70, 85, 100, 70, 45, 55, 60, 55, 40, 70];
    let x = 40;

    // Header row
    doc.fontSize(7).fillColor('#fff');
    headers.forEach((h, i) => {
      doc.rect(x, tableTop, colWidths[i], 18).fill('#E30613');
      doc.fillColor('#fff').text(h, x + 3, tableTop + 5, { width: colWidths[i] - 6 });
      x += colWidths[i];
    });

    // Data rows
    let y = tableTop + 18;
    feedbacks.slice(0, 30).forEach((f, i) => {
      if (y > 530) {
        doc.addPage();
        y = 40;
      }

      x = 40;
      const rowColor = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
      const vals = [
        String(i + 1),
        new Date(f.submittedAt).toLocaleDateString('id-ID'),
        f.lo.noLO,
        f.lo.spbu.name,
        f.lo.product,
        f.sealCondition,
        f.volumeStatus,
        f.visualCondition.replace('_', ' '),
        String(f.density),
        `${f.rating}/5`,
        f.status,
      ];

      vals.forEach((v, j) => {
        doc.rect(x, y, colWidths[j], 16).fill(rowColor);
        doc.fillColor(f.status === 'HIGH_PRIORITY' && j === 10 ? '#E30613' : '#333')
          .fontSize(6).text(v, x + 3, y + 4, { width: colWidths[j] - 6 });
        x += colWidths[j];
      });
      y += 16;
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Export gagal' });
  }
});

module.exports = router;
