const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...\n');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Ensure sample SPBU exists for SPBU user relation
  let spbu = await prisma.spbu.findFirst();
  if (!spbu) {
    spbu = await prisma.spbu.create({
      data: {
        code: '71.953.01',
        name: 'SPBU Bitung 71.953.01',
        address: 'Jl. Raya Bitung',
        lat: 1.4432,
        lng: 125.1884,
      },
    });
  }

  // Ensure sample AMT exists for AMT user relation
  let amt = await prisma.amt.findFirst();
  if (!amt) {
    amt = await prisma.amt.create({
      data: {
        nip: '123456',
        code: 'AMT-001',
        name: 'Driver AMT Bitung',
        phone: '081234567893',
      },
    });
  }

  // Create/update 1 user account per role
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@qpass.com' },
      update: { password: hashedPassword, role: 'ADMIN', isVerified: true, isActive: true },
      create: { name: 'Administrator', email: 'admin@qpass.com', password: hashedPassword, role: 'ADMIN', phone: '081234567890', isVerified: true, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'pengawas@qpass.com' },
      update: { password: hashedPassword, role: 'PENGAWAS', isVerified: true, isActive: true },
      create: { name: 'Pengawas IT Bitung', email: 'pengawas@qpass.com', password: hashedPassword, role: 'PENGAWAS', phone: '081234567891', isVerified: true, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'spbu@qpass.com' },
      update: { password: hashedPassword, role: 'SPBU', spbuId: spbu.id, isVerified: true, isActive: true },
      create: { name: 'Operator SPBU', email: 'spbu@qpass.com', password: hashedPassword, role: 'SPBU', spbuId: spbu.id, phone: '081234567892', isVerified: true, isActive: true },
    }),
    prisma.user.upsert({
      where: { email: 'amt@qpass.com' },
      update: { password: hashedPassword, role: 'AMT', amtId: amt.id, isVerified: true, isActive: true },
      create: { name: 'Driver AMT', email: 'amt@qpass.com', password: hashedPassword, role: 'AMT', amtId: amt.id, phone: '081234567893', isVerified: true, isActive: true },
    }),
  ]);

  console.log(`✅ Created/Updated ${users.length} users (1 account per role)`);
  console.log('\n📋 Login Credentials:');
  console.log('   1. Admin:    admin@qpass.com    / admin123');
  console.log('   2. Pengawas: pengawas@qpass.com / admin123');
  console.log('   3. SPBU:     spbu@qpass.com     / admin123');
  console.log('   4. AMT:      amt@qpass.com      / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

