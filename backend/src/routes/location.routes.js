const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Helper to determine amtId from authenticated user
const getAmtIdFromUser = async (user) => {
  if (user.amtId) return user.amtId;
  const amt = await prisma.amt.findFirst({
    where: { OR: [{ nip: user.email }, { name: { equals: user.name, mode: 'insensitive' } }] },
  });
  return amt ? amt.id : null;
};

// POST /api/location/update - Receive location update from AMT (Single or Batch)
router.post('/update', authenticate, async (req, res) => {
  try {
    const amtId = await getAmtIdFromUser(req.user);
    if (!amtId) {
      return res.status(400).json({ success: false, message: 'Profil AMT tidak ditemukan untuk akun ini' });
    }

    const { lat, lng, speed, heading, accuracy, loId, locations, status = 'IN_TRANSIT' } = req.body;

    // Handle Batch Sync (if AMT was offline and sending queued locations)
    if (Array.isArray(locations) && locations.length > 0) {
      const logsData = locations.map(loc => ({
        amtId,
        loId: loc.loId ? parseInt(loc.loId) : (loId ? parseInt(loId) : null),
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lng),
        speed: loc.speed ? parseFloat(loc.speed) : null,
        heading: loc.heading ? parseFloat(loc.heading) : null,
        accuracy: loc.accuracy ? parseFloat(loc.accuracy) : null,
        status: loc.status || status,
        recordedAt: loc.recordedAt ? new Date(loc.recordedAt) : new Date(),
      }));

      await prisma.amtLocationLog.createMany({ data: logsData });

      // Update latest position from last element
      const lastLoc = locations[locations.length - 1];
      const updatedAmt = await prisma.amt.update({
        where: { id: amtId },
        data: {
          latestLat: parseFloat(lastLoc.lat),
          latestLng: parseFloat(lastLoc.lng),
          lastLocationUpdate: new Date(),
        },
      });

      // Broadcast Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.emit('amt-location-update', {
          amtId,
          amtName: updatedAmt.name,
          loId: lastLoc.loId ? parseInt(lastLoc.loId) : (loId ? parseInt(loId) : null),
          lat: parseFloat(lastLoc.lat),
          lng: parseFloat(lastLoc.lng),
          speed: lastLoc.speed ? parseFloat(lastLoc.speed) : null,
          heading: lastLoc.heading ? parseFloat(lastLoc.heading) : null,
          status: lastLoc.status || status,
          recordedAt: new Date(),
        });
      }

      return res.json({ success: true, message: `${locations.length} titik lokasi berhasil disinkronisasi` });
    }

    // Handle Single Real-Time Update
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude dan longitude wajib diisi' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedLoId = loId ? parseInt(loId) : null;

    // Create log record
    const locationLog = await prisma.amtLocationLog.create({
      data: {
        amtId,
        loId: parsedLoId,
        lat: parsedLat,
        lng: parsedLng,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        status,
        recordedAt: new Date(),
      },
    });

    // Update AMT current position
    const updatedAmt = await prisma.amt.update({
      where: { id: amtId },
      data: {
        latestLat: parsedLat,
        latestLng: parsedLng,
        lastLocationUpdate: new Date(),
      },
    });

    // Get active LO details for socket broadcast if available
    let activeLO = null;
    if (parsedLoId) {
      activeLO = await prisma.loadingOrder.findUnique({
        where: { id: parsedLoId },
        include: {
          spbu: { select: { id: true, name: true, code: true, lat: true, lng: true } },
          truck: { select: { id: true, nopol: true } },
        },
      });
    }

    const socketPayload = {
      amtId,
      amtName: updatedAmt.name,
      loId: parsedLoId,
      noLO: activeLO?.noLO || null,
      truckNopol: activeLO?.truck?.nopol || null,
      spbuName: activeLO?.spbu?.name || null,
      spbuLat: activeLO?.spbu?.lat || null,
      spbuLng: activeLO?.spbu?.lng || null,
      lat: parsedLat,
      lng: parsedLng,
      speed: speed ? parseFloat(speed) : 0,
      heading: heading ? parseFloat(heading) : 0,
      status,
      recordedAt: locationLog.recordedAt,
    };

    // Emit live Socket.IO update to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('amt-location-update', socketPayload);
    }

    res.json({ success: true, data: socketPayload });
  } catch (error) {
    console.error('Update AMT location error:', error);
    res.status(500).json({ success: false, message: 'Server error saat menyimpan lokasi' });
  }
});

// GET /api/location/active - Get all active AMT trucks currently IN_TRANSIT
router.get('/active', authenticate, authorize('ADMIN', 'PENGAWAS', 'SPBU'), async (req, res) => {
  try {
    const activeLOs = await prisma.loadingOrder.findMany({
      where: {
        status: 'IN_TRANSIT',
      },
      include: {
        amt: {
          select: {
            id: true,
            name: true,
            phone: true,
            latestLat: true,
            latestLng: true,
            lastLocationUpdate: true,
          },
        },
        truck: { select: { id: true, nopol: true, capacity: true } },
        spbu: { select: { id: true, name: true, code: true, lat: true, lng: true, address: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activeTrackings = activeLOs.map(lo => ({
      loId: lo.id,
      noLO: lo.noLO,
      product: lo.product,
      volume: lo.volume,
      status: lo.status,
      amt: lo.amt,
      truck: lo.truck,
      spbu: lo.spbu,
      lat: lo.amt?.latestLat || null,
      lng: lo.amt?.latestLng || null,
      lastUpdate: lo.amt?.lastLocationUpdate || null,
    }));

    res.json({ success: true, data: activeTrackings });
  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/location/history/:loId - Get breadcrumb trail history for a specific LO
router.get('/history/:loId', authenticate, authorize('ADMIN', 'PENGAWAS'), async (req, res) => {
  try {
    const loId = parseInt(req.params.loId);
    const logs = await prisma.amtLocationLog.findMany({
      where: { loId },
      orderBy: { recordedAt: 'asc' },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
