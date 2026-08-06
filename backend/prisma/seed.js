const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...\n');

  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create/update users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@qpass.com' },
      update: { password: hashedPassword },
      create: { name: 'Administrator', email: 'admin@qpass.com', password: hashedPassword, role: 'ADMIN', phone: '081234567890', isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'pengawas@qpass.com' },
      update: { password: hashedPassword },
      create: { name: 'Pengawas IT Bitung', email: 'pengawas@qpass.com', password: hashedPassword, role: 'PENGAWAS', phone: '081234567891', isVerified: true },
    }),
    prisma.user.upsert({
      where: { email: 'pengawas2@qpass.com' },
      update: { password: hashedPassword },
      create: { name: 'Pengawas Operasi', email: 'pengawas2@qpass.com', password: hashedPassword, role: 'PENGAWAS', phone: '081234567892', isVerified: true },
    }),
  ]);

  console.log(`✅ Created/Updated ${users.length} users`);
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:    admin@qpass.com / admin123');
  console.log('   Pengawas: pengawas@qpass.com / admin123');
  console.log('   Pengawas2: pengawas2@qpass.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
