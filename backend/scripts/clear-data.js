const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  console.log('🗑️  Clearing database data...\n');

  try {
    // Delete in correct order to respect foreign key constraints
    
    // 1. Delete complaints (depends on feedbacks)
    const deletedComplaints = await prisma.complaint.deleteMany({});
    console.log(`✅ Deleted ${deletedComplaints.count} complaints`);

    // 2. Delete feedbacks (depends on loading orders)
    const deletedFeedbacks = await prisma.feedback.deleteMany({});
    console.log(`✅ Deleted ${deletedFeedbacks.count} feedbacks`);

    // 3. Delete loading orders (depends on SPBU, Truck, AMT)
    const deletedLOs = await prisma.loadingOrder.deleteMany({});
    console.log(`✅ Deleted ${deletedLOs.count} loading orders`);

    // 4. Delete SPBU and AMT users (keep ADMIN and PENGAWAS)
    const deletedSPBUUsers = await prisma.user.deleteMany({
      where: { role: 'SPBU' }
    });
    console.log(`✅ Deleted ${deletedSPBUUsers.count} SPBU users`);

    const deletedAMTUsers = await prisma.user.deleteMany({
      where: { role: 'AMT' }
    });
    console.log(`✅ Deleted ${deletedAMTUsers.count} AMT users`);

    // 5. Delete AMTs
    const deletedAMTs = await prisma.amt.deleteMany({});
    console.log(`✅ Deleted ${deletedAMTs.count} AMTs`);

    // 6. Delete Trucks
    const deletedTrucks = await prisma.truck.deleteMany({});
    console.log(`✅ Deleted ${deletedTrucks.count} trucks`);

    // 7. Delete SPBUs
    const deletedSPBUs = await prisma.spbu.deleteMany({});
    console.log(`✅ Deleted ${deletedSPBUs.count} SPBUs`);

    console.log('\n🎉 Data clearing complete!');
    console.log('\n📋 Preserved data:');
    console.log('   - ADMIN users');
    console.log('   - PENGAWAS users');
    console.log('   - Audit logs');
    console.log('   - Notifications');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
