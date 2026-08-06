const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showSpbuCodes() {
  try {
    console.log('Daftar Kode SPBU yang Terdaftar:\n');
    
    const spbus = await prisma.spbu.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
      orderBy: { code: 'asc' },
    });

    if (spbus.length === 0) {
      console.log('Tidak ada data SPBU di database.');
      return;
    }

    console.table(spbus.map(s => ({
      ID: s.id,
      Kode: s.code,
      Nama: s.name,
      Status: s.isActive ? 'Aktif' : 'Nonaktif'
    })));

    console.log('\nGunakan kode di atas untuk registrasi akun SPBU.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showSpbuCodes();
