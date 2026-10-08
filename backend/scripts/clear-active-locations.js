const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Cleaning active location tracking data...\n');

  // 1. Update all IN_TRANSIT Loading Orders to COMPLETED
  const updatedLOs = await prisma.loadingOrder.updateMany({
    where: { status: 'IN_TRANSIT' },
    data: { status: 'COMPLETED' },
  });
  console.log(`✅ Updated ${updatedLOs.count} Loading Orders from IN_TRANSIT to COMPLETED`);

  // 2. Clear location logs
  const deletedLogs = await prisma.amtLocationLog.deleteMany({});
  console.log(`✅ Deleted ${deletedLogs.count} AMT location logs`);

  // 3. Clear AMT latestLat / latestLng
  const updatedAMTs = await prisma.amt.updateMany({
    data: {
      latestLat: null,
      latestLng: null,
      lastLocationUpdate: null,
    },
  });
  console.log(`✅ Cleared latest location coordinates for ${updatedAMTs.count} AMT drivers`);

  console.log('\n🎉 Active location tracking cleared successfully! Map will now show 0 active trucks.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
