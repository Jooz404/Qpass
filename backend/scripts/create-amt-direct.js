require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAMTUser() {
  try {
    console.log('=== Membuat User AMT ===\n');

    // Step 1: Create AMT record
    console.log('1. Membuat record AMT...');
    let amt;
    try {
      amt = await prisma.amt.create({
        data: {
          name: 'AMT Budi Santoso',
          nik: '1234567890123456',
          phone: '081234567890',
          isActive: true
        }
      });
      console.log('✅ AMT record dibuat dengan ID:', amt.id);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('⚠️ AMT dengan NIK ini sudah ada, mencoba mengambil data yang ada...');
        amt = await prisma.amt.findUnique({
          where: { nik: '1234567890123456' }
        });
        console.log('✅ Menggunakan AMT yang sudah ada dengan ID:', amt.id);
      } else {
        throw error;
      }
    }

    // Step 2: Create User with AMT role
    console.log('\n2. Membuat user AMT...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: 'AMT Test User',
          email: 'amt@test.com',
          password: hashedPassword,
          role: 'AMT',
          amtId: amt.id,
          isActive: true,
          isVerified: true
        }
      });
      console.log('✅ User AMT dibuat dengan ID:', user.id);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('⚠️ User dengan email ini sudah ada');
        user = await prisma.user.findUnique({
          where: { email: 'amt@test.com' }
        });
        console.log('✅ User yang sudah ada dengan ID:', user.id);
      } else {
        throw error;
      }
    }

    console.log('\n=== Berhasil! ===');
    console.log('Login dengan:');
    console.log('Email: amt@test.com');
    console.log('Password: password123');
    console.log('\nSetelah login, user akan diarahkan ke /amt-dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAMTUser();
