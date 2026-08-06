const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSpbuCoordinates() {
  try {
    console.log('Updating SPBU coordinates to match actual addresses...\n');
    
    // Updated coordinates based on specific addresses in Sulawesi Utara
    const spbuUpdates = [
      {
        code: '71.951.03',
        name: 'SPBU Pertamina Retail',
        address: 'JL. PIERRE TENDEAN / 00000 MANADO',
        lat: 1.4927,
        lng: 124.8467
      },
      {
        code: '73.951.06',
        name: 'SPBU Mutiara Mitra Abadi',
        address: 'JL. RING ROAD I KM 4-5 KEL. PAAL DUA',
        lat: 1.4850,
        lng: 124.8550
      },
      {
        code: '73.951.07',
        name: 'SPBU Makmur Buana Sentosa',
        address: 'JL. YOS SUDARSO NOMOR 28, KEL.',
        lat: 1.4880,
        lng: 124.8420
      },
      {
        code: '74.953.03',
        name: 'SPBU Tiga Putri Matuari',
        address: 'Jl. Girian Atas No.22, Bitung',
        lat: 1.4400,
        lng: 125.1200
      },
      {
        code: '74.953.04',
        name: 'SPBU Tiga Putri Matuari',
        address: 'JL. AIR MADIDI - LIKUPAN KEL.',
        lat: 1.5167,
        lng: 124.9833
      },
      {
        code: '74.953.13',
        name: 'SPBU Tulaar Petrolindo',
        address: 'JL. RAYA TOMOHON',
        lat: 1.3083,
        lng: 124.8417
      },
      {
        code: '74.953.05',
        name: 'SPBU Galuga Putra Mandiri',
        address: 'JL. TRANS SULAWESI - GORONTALO',
        lat: 0.5400,
        lng: 123.0300
      },
      {
        code: '74.953.06',
        name: 'SPBU Samudra Energy Mandiri',
        address: 'JL. POROS BITUNG - MANADO, KEL.',
        lat: 1.4450,
        lng: 124.9500
      }
    ];

    for (const spbu of spbuUpdates) {
      const existing = await prisma.spbu.findUnique({ where: { code: spbu.code } });
      
      if (existing) {
        await prisma.spbu.update({
          where: { code: spbu.code },
          data: {
            lat: spbu.lat,
            lng: spbu.lng
          }
        });
        console.log(`✓ Updated ${spbu.code} - ${spbu.name}`);
        console.log(`  Address: ${spbu.address}`);
        console.log(`  Coordinates: ${spbu.lat}, ${spbu.lng}\n`);
      } else {
        console.log(`✗ Not found: ${spbu.code}`);
      }
    }

    console.log('Coordinates update completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSpbuCoordinates();
