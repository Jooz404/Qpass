const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLONumbers() {
  try {
    console.log('Checking Loading Order numbers...\n');
    
    const los = await prisma.loadingOrder.findMany({
      select: {
        id: true,
        noLO: true,
        product: true,
        qrToken: true,
        status: true,
        spbu: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (los.length === 0) {
      console.log('Tidak ada Loading Order di database.');
      return;
    }

    console.log('Recent Loading Orders:');
    console.table(los.map(lo => ({
      ID: lo.id,
      NoLO: lo.noLO,
      QRToken: lo.qrToken,
      Produk: lo.product,
      Status: lo.status,
      SPBU: lo.spbu.name,
    })));

    console.log('\nFormat nomor LO di database:');
    console.log('Contoh:', los[0].noLO);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLONumbers();
