require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAMTUser() {
  try {
    console.log('=== Membuat User AMT ===\n');

    // Input data
    const name = 'AMT Test User';
    const email = 'amt@test.com';
    const password = 'password123';
    const amtName = 'AMT Budi Santoso';
    const amtNik = '1234567890123456';
    const amtPhone = '081234567890';

    console.log('Data yang akan dibuat:');
    console.log('Nama:', name);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Nama AMT:', amtName);
    console.log('NIK AMT:', amtNik);
    console.log('Phone AMT:', amtPhone);
    console.log('');

    // Create AMT record first
    console.log('1. Membuat record AMT...');
    const amt = await prisma.amt.create({
      data: {
        name: amtName,
        nik: amtNik,
        phone: amtPhone,
        isActive: true
      }
    });
    console.log('✅ AMT record dibuat dengan ID:', amt.id);

    // Hash password
    console.log('2. Meng-hash password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User with AMT role
    console.log('3. Membuat user AMT...');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'AMT',
        amtId: amt.id,
        isActive: true,
        isVerified: true
      }
    });
    console.log('✅ User AMT dibuat dengan ID:', user.id);

    console.log('\n=== Berhasil! ===');
    console.log('Login dengan:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nSetelah login, user akan diarahkan ke /amt-dashboard');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.log('Email atau NIK sudah terdaftar!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAMTUser();
