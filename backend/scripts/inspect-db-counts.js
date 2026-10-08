const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectCounts() {
  try {
    const counts = {
      users: await prisma.user.count(),
      spbus: await prisma.spbu.count(),
      trucks: await prisma.truck.count(),
      amts: await prisma.amt.count(),
      loadingOrders: await prisma.loadingOrder.count(),
      feedbacks: await prisma.feedback.count(),
      amtFeedbacks: await prisma.aMTFeedback.count(),
      complaints: await prisma.complaint.count(),
      notifications: await prisma.notification.count(),
      auditLogs: await prisma.auditLog.count(),
      amtLocationLogs: await prisma.amtLocationLog.count(),
      qualityControls: await prisma.qualityControl.count(),
      vesselDischarges: await prisma.vesselDischarge.count(),
      vesselDischargeTanks: await prisma.vesselDischargeTank.count()
    };

    console.log('=== CURRENT DATABASE ROW COUNTS ===');
    console.table(counts);

    const spbuList = await prisma.spbu.findMany({ select: { id: true, code: true, name: true } });
    console.log(`Total SPBU Records preserved: ${spbuList.length}`);

    const userBreakdown = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    console.log('User Role Breakdown:', userBreakdown);

  } catch (err) {
    console.error('Error inspecting database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectCounts();
