const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testing login with demo account...');
    
    const email = 'admin@qpass.com';
    const password = 'admin123';
    
    console.log(`\nEmail: ${email}`);
    console.log(`Password: ${password}`);
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✓ User found: ${user.name}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Active: ${user.isActive}`);
    
    // Test password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`\nPassword match: ${isMatch ? '✓' : '❌'}`);
    
    if (!isMatch) {
      console.log('Password does not match. Testing with different passwords...');
      
      // Try common passwords
      const testPasswords = ['admin', 'password', '123456'];
      for (const testPwd of testPasswords) {
        const testMatch = await bcrypt.compare(testPwd, user.password);
        if (testMatch) {
          console.log(`✓ Password matches: ${testPwd}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
