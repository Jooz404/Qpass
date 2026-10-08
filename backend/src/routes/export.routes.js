const router = require('express').Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/export/feedback/excel
router.get('/feedback/excel', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU', 'AMT'), async (req, res) => {
  try {
    const { startDate, endDate, status, spbuId, search } = req.query;
    const where = {};

    // Role-based data scoping
    if (req.user.role === 'SPBU') {
      where.spbuId = req.user.spbuId;
    } else if (req.user.role === 'AMT') {
      where.lo = { amtId: req.user.amtId };
    } else if (spbuId) {
      where.spbuId = parseInt(spbuId);
    }

    if (status) where.status = status;

    // Filter by LO search query if present
    if (search) {
      where.lo = {
        ...(where.lo || {}),
        noLO: { contains: search, mode: 'insensitive' }
      };
    }

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

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Waktu', key: 'date', width: 18 },
      { header: 'No. LO', key: 'noLO', width: 20 },
      { header: 'SPBU', key: 'spbu', width: 25 },
      { header: 'Alamat SPBU', key: 'address', width: 30 },
      { header: 'Produk', key: 'product', width: 15 },
      { header: 'Nopol Tangki', key: 'nopol', width: 12 },
      { header: 'Nama AMT', key: 'amt', width: 20 },
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
        date: f.submittedAt ? new Date(f.submittedAt).toLocaleString('id-ID') : '-',
        noLO: f.lo?.noLO || '-',
        spbu: f.lo?.spbu?.name ? `${f.lo.spbu.name} (${f.lo.spbu.code})` : '-',
        address: f.lo?.spbu?.address || '-',
        product: f.lo?.product || '-',
        nopol: f.lo?.truck?.nopol || '-',
        amt: f.lo?.amt?.name || '-',
        segel: f.sealCondition || '-',
        volume: f.volumeStatus || '-',
        selisih: f.volumeDiff || '-',
        visual: f.visualCondition ? f.visualCondition.replace('_', ' ') : '-',
        densitas: f.density ?? '-',
        rating: `${f.rating || 0}/5`,
        status: f.status || 'NORMAL',
        notes: f.notes || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=QPass_Feedback_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Export gagal: ' + error.message });
  }
});

// GET /api/export/feedback/pdf
router.get('/feedback/pdf', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU', 'AMT'), async (req, res) => {
  try {
    const { startDate, endDate, status, spbuId, search } = req.query;
    const where = {};

    // Role-based data scoping
    if (req.user.role === 'SPBU') {
      where.spbuId = req.user.spbuId;
    } else if (req.user.role === 'AMT') {
      where.lo = { amtId: req.user.amtId };
    } else if (spbuId) {
      where.spbuId = parseInt(spbuId);
    }

    if (status) where.status = status;

    if (search) {
      where.lo = {
        ...(where.lo || {}),
        noLO: { contains: search, mode: 'insensitive' }
      };
    }

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
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=QPass_Report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header Helper
    const drawHeader = () => {
      doc.fontSize(16).fillColor('#E30613').text('Q-PASS BITUNG - LAPORAN RIWAYAT FEEDBACK Q&Q', { align: 'center' });
      doc.fontSize(9).fillColor('#666').text('Quality & Quantity Assurance Testimonial System — Integrated Terminal Bitung', { align: 'center' });
      doc.fontSize(8).fillColor('#666').text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
      doc.moveDown(0.8);
    };

    drawHeader();

    // Summary Stats
    const total = feedbacks.length;
    const highPriority = feedbacks.filter(f => f.status === 'HIGH_PRIORITY').length;
    const avgRating = total > 0 ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / total).toFixed(1) : '0';

    doc.fontSize(9).fillColor('#111827');
    doc.text(`Total Data: ${total} | High Priority: ${highPriority} | Rata-rata Rating: ${avgRating}/5`, { align: 'left' });
    doc.moveDown(0.5);

    // Table settings
    const headers = ['No', 'Tanggal', 'No. LO', 'SPBU', 'Produk', 'Nopol', 'AMT', 'Segel', 'Volume', 'Visual', 'Densitas', 'Rating', 'Status'];
    const colWidths = [24, 75, 80, 100, 65, 55, 90, 45, 55, 60, 45, 38, 50];

    const renderTableHeader = (topY) => {
      let x = 30;
      doc.fontSize(7).fillColor('#ffffff');
      headers.forEach((h, idx) => {
        doc.rect(x, topY, colWidths[idx], 18).fill('#E30613');
        doc.fillColor('#ffffff').text(h, x + 2, topY + 5, { width: colWidths[idx] - 4, align: 'left' });
        x += colWidths[idx];
      });
      return topY + 18;
    };

    let y = renderTableHeader(doc.y);

    feedbacks.forEach((f, i) => {
      // Check if space left on page
      if (y > 510) {
        doc.addPage();
        drawHeader();
        y = renderTableHeader(doc.y);
      }

      let x = 30;
      const rowBg = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
      const isHighPriority = f.status === 'HIGH_PRIORITY';

      const vals = [
        String(i + 1),
        f.submittedAt ? new Date(f.submittedAt).toLocaleDateString('id-ID') : '-',
        f.lo?.noLO || '-',
        f.lo?.spbu?.name || '-',
        f.lo?.product || '-',
        f.lo?.truck?.nopol || '-',
        f.lo?.amt?.name || '-',
        f.sealCondition || '-',
        f.volumeStatus === 'SELISIH' ? `SELISIH (${f.volumeDiff || 0}L)` : (f.volumeStatus || '-'),
        f.visualCondition ? f.visualCondition.replace('_', ' ') : '-',
        f.density !== undefined && f.density !== null ? String(f.density) : '-',
        `${f.rating || 0}/5`,
        f.status || 'NORMAL',
      ];

      vals.forEach((v, j) => {
        doc.rect(x, y, colWidths[j], 16).fill(rowBg);
        const textColor = isHighPriority && j === 12 ? '#DC2626' : '#1F2937';
        doc.fillColor(textColor).fontSize(6).text(v, x + 2, y + 4, { width: colWidths[j] - 4, height: 12, ellipsis: true });
        x += colWidths[j];
      });
      y += 16;
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Export gagal: ' + error.message });
  }
});

module.exports = router;
