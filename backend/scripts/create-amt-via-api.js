require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

async function createAMTUser() {
  try {
    console.log('=== Membuat User AMT via API ===\n');

    // Step 1: Create AMT record
    console.log('1. Membuat record AMT...');
    const amtResponse = await axios.post(`${API_URL}/amt`, {
      name: 'AMT Budi Santoso',
      nik: '1234567890123456',
      phone: '081234567890'
    });
    
    const amtId = amtResponse.data.data.id;
    console.log('✅ AMT record dibuat dengan ID:', amtId);

    // Step 2: Create User with AMT role (this needs to be done via admin panel or direct DB)
    console.log('\n2. Untuk membuat user AMT, gunakan salah satu cara:');
    console.log('');
    console.log('   a) Via Admin Panel:');
    console.log('      - Login sebagai ADMIN');
    console.log('      - Masuk ke /users');
    console.log('      - Tambah user dengan role AMT dan amtId:', amtId);
    console.log('');
    console.log('   b) Via Database (SQL):');
    console.log(`      INSERT INTO users (name, email, password, role, amtId, isActive, isVerified, createdAt, updatedAt)`);
    console.log(`      VALUES ('AMT Test User', 'amt@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY6qYqYqYqY', 'AMT', ${amtId}, 1, 1, NOW(), NOW());`);
    console.log('');
    console.log('   c) Via API (perlu admin token):');
    console.log(`      POST ${API_URL}/users`);
    console.log(`      Body: { "name": "AMT Test User", "email": "amt@test.com", "password": "password123", "role": "AMT", "amtId": ${amtId} }`);
    console.log('');
    console.log('=== AMT Record ID:', amtId, '===');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createAMTUser();
