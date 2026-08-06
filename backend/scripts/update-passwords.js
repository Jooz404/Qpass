const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateDemoPasswords() {
  try {
    console.log('Updating demo account passwords to admin123...');
    
    const demoAccounts = [
      'admin@qpass.com',
      'pengawas@qpass.com', 
      'spbu@qpass.com'
    ];

    for (const email of demoAccounts) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`✓ Updated password for ${email}`);
    }

    console.log('\nPassword update completed!');
    console.log('You can now login with:');
    console.log('Email: admin@qpass.com, Password: admin123');
    console.log('Email: pengawas@qpass.com, Password: admin123');
    console.log('Email: spbu@qpass.com, Password: admin123');
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoPasswords();
