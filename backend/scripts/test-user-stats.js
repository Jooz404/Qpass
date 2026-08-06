const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserStats() {
  try {
    console.log('Testing user stats calculation...\n');
    
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    console.log('User Statistics:');
    console.log('================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Active Users: ${activeUsers}`);
    console.log(`Inactive Users: ${inactiveUsers}`);
    console.log('\nExpected API Response:');
    console.log(JSON.stringify({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
      },
    }, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserStats();
