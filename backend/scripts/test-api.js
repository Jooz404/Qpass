const axios = require('axios');

async function testLoginAPI() {
  try {
    console.log('Testing login API at http://localhost:5002/api/auth/login');
    
    const response = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'admin@qpass.com',
      password: 'admin123'
    });
    
    console.log('✓ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Backend may not be running.');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLoginAPI();
