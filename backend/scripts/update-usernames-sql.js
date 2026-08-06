const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUsernames() {
  try {
    console.log('Updating existing users with usernames using raw SQL...');
    
    // Update users by extracting username from email
    await prisma.$executeRaw`
      UPDATE users 
      SET username = SUBSTRING_INDEX(email, '@', 1)
      WHERE username IS NULL OR username = ''
    `;
    
    // For users without email, set username based on role
    await prisma.$executeRaw`
      UPDATE users 
      SET username = LOWER(role)
      WHERE username IS NULL OR username = ''
    `;
    
    console.log('Username update completed successfully!');
    
    // Verify the updates
    const users = await prisma.$queryRaw`SELECT id, name, email, username, role FROM users`;
    console.log('Current users:');
    console.table(users);
    
  } catch (error) {
    console.error('Error updating usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsernames();
