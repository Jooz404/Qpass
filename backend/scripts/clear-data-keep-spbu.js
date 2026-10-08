const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDataKeepSpbu() {
  console.log('🗑️  Memulai proses pembersihan data (Menyisakan Master SPBU)...\n');

  try {
    // Foreign key deletion order:
    
    // 1. Complaints
    const deletedComplaints = await prisma.complaint.deleteMany({});
    console.log(`✅ Deleted ${deletedComplaints.count} complaints`);

    // 2. AMT Feedbacks
    const deletedAMTFeedbacks = await prisma.aMTFeedback.deleteMany({});
    console.log(`✅ Deleted ${deletedAMTFeedbacks.count} AMT feedbacks`);

    // 3. SPBU Feedbacks
    const deletedFeedbacks = await prisma.feedback.deleteMany({});
    console.log(`✅ Deleted ${deletedFeedbacks.count} feedbacks`);

    // 4. AMT Location Logs
    const deletedAmtLocationLogs = await prisma.amtLocationLog.deleteMany({});
    console.log(`✅ Deleted ${deletedAmtLocationLogs.count} AMT location logs`);

    // 5. Quality Controls
    const deletedQualityControls = await prisma.qualityControl.deleteMany({});
    console.log(`✅ Deleted ${deletedQualityControls.count} quality control records`);

    // 6. Vessel Discharge Tanks & Vessel Discharges
    const deletedVesselDischargeTanks = await prisma.vesselDischargeTank.deleteMany({});
    console.log(`✅ Deleted ${deletedVesselDischargeTanks.count} vessel discharge tank records`);

    const deletedVesselDischarges = await prisma.vesselDischarge.deleteMany({});
    console.log(`✅ Deleted ${deletedVesselDischarges.count} vessel discharge records`);

    // 7. Loading Orders
    const deletedLOs = await prisma.loadingOrder.deleteMany({});
    console.log(`✅ Deleted ${deletedLOs.count} loading orders`);

    // 8. AMTs (Master Data Supir)
    const deletedAMTs = await prisma.amt.deleteMany({});
    console.log(`✅ Deleted ${deletedAMTs.count} AMTs`);

    // 9. Trucks (Master Data Mobil Tangki)
    const deletedTrucks = await prisma.truck.deleteMany({});
    console.log(`✅ Deleted ${deletedTrucks.count} trucks`);

    // 10. Notifications & Audit Logs
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

    const deletedAuditLogs = await prisma.auditLog.deleteMany({});
    console.log(`✅ Deleted ${deletedAuditLogs.count} audit logs`);

    // 11. Delete AMT Users (keep ADMIN, PENGAWAS, and SPBU users)
    const deletedAMTUsers = await prisma.user.deleteMany({
      where: { role: 'AMT' }
    });
    console.log(`✅ Deleted ${deletedAMTUsers.count} AMT users`);

    // 12. Verify SPBU records were preserved
    const totalSpbus = await prisma.spbu.count();
    console.log(`\n📌 Master Data SPBU yang dipertahankan: ${totalSpbus} SPBU`);

    const totalUsers = await prisma.user.count();
    console.log(`📌 Akun Pengguna yang dipertahankan: ${totalUsers} Users (Admin & Pengawas)`);

    console.log('\n🎉 Pembersihan data selesai dengan sukses! Data SPBU tetap utuh.');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDataKeepSpbu().catch((e) => {
  console.error(e);
  process.exit(1);
});
