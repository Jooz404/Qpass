const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpbuCoordinates() {
  try {
    console.log('Checking SPBU coordinates...\n');
    
    const spbus = await prisma.spbu.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        lat: true,
        lng: true,
        address: true,
      },
    });

    if (spbus.length === 0) {
      console.log('Tidak ada data SPBU di database.');
      return;
    }

    console.log('SPBU Data with Coordinates:');
    console.table(spbus.map(s => ({
      ID: s.id,
      Kode: s.code,
      Nama: s.name,
      Latitude: s.lat || 'NULL',
      Longitude: s.lng || 'NULL',
      Address: s.address?.substring(0, 30) + '...' || '-',
    })));

    const withCoords = spbus.filter(s => s.lat && s.lng);
    const withoutCoords = spbus.filter(s => !s.lat || !s.lng);
    
    console.log(`\nSummary:`);
    console.log(`Total SPBU: ${spbus.length}`);
    console.log(`With coordinates: ${withCoords.length}`);
    console.log(`Without coordinates: ${withoutCoords.length}`);
    
    if (withoutCoords.length > 0) {
      console.log('\nSPBU without coordinates:');
      console.table(withoutCoords.map(s => ({
        Kode: s.code,
        Nama: s.name,
      })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpbuCoordinates();
