const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUsernames() {
  try {
    console.log('Updating existing users with usernames...');
    
    // Get all users
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      let username;
      
      // Generate username from email or use a default
      if (user.email) {
        // Extract username from email (before @)
        username = user.email.split('@')[0];
      } else {
        // Fallback based on role
        username = user.role.toLowerCase();
      }
      
      // Update user with username
      await prisma.user.update({
        where: { id: user.id },
        data: { username }
      });
      
      console.log(`Updated user ${user.name} with username: ${username}`);
    }
    
    console.log('Username update completed successfully!');
  } catch (error) {
    console.error('Error updating usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsernames();
