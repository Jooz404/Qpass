const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAndCreateDemoUsers() {
  try {
    console.log('Checking existing users...');
    const users = await prisma.user.findMany();
    console.log('Current users in database:');
    console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive })));

    // Demo accounts
    const demoAccounts = [
      { name: 'Admin IT Bitung', email: 'admin@qpass.com', password: 'admin123', role: 'ADMIN' },
      { name: 'Pengawas IT Bitung', email: 'pengawas@qpass.com', password: 'admin123', role: 'PENGAWAS' },
      { name: 'Operator SPBU', email: 'spbu@qpass.com', password: 'admin123', role: 'SPBU' },
    ];

    for (const demo of demoAccounts) {
      const existing = await prisma.user.findUnique({ where: { email: demo.email } });
      
      if (!existing) {
        console.log(`Creating demo account: ${demo.email}`);
        const hashedPassword = await bcrypt.hash(demo.password, 12);
        await prisma.user.create({
          data: {
            name: demo.name,
            email: demo.email,
            password: hashedPassword,
            role: demo.role,
            isActive: true,
          },
        });
        console.log(`✓ Created ${demo.email}`);
      } else {
        console.log(`✓ Already exists: ${demo.email}`);
      }
    }

    console.log('\nFinal user list:');
    const finalUsers = await prisma.user.findMany();
    console.table(finalUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateDemoUsers();
