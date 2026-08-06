const axios = require('axios');

async function testRegister() {
  try {
    console.log('Testing registration...\n');
    
    const testData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      spbuCode: '74.951.01'
    };
    
    console.log('Sending data:', testData);
    
    const response = await axios.post('http://localhost:5002/api/auth/register', testData);
    
    console.log('\n✓ Registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('\n✗ Registration failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRegister();
