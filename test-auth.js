const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  console.log('Testing authentication...');
  
  try {
    // Test with customer credentials
    console.log('\nTesting customer login:');
    try {
      const customerResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'customer@example.com',
        password: 'password123'
      });
      console.log('Customer login response:', customerResponse.data);
    } catch (error) {
      console.error('Customer login failed:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Test with admin credentials
    console.log('\nTesting admin login:');
    try {
      const adminResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
      });
      console.log('Admin login response:', adminResponse.data);
    } catch (error) {
      console.error('Admin login failed:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
    // Test with stocker credentials
    console.log('\nTesting stocker login:');
    try {
      const stockerResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'stocker@example.com',
        password: 'password123'
      });
      console.log('Stocker login response:', stockerResponse.data);
    } catch (error) {
      console.error('Stocker login failed:');
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('General test failure:', error.message);
  }
}

testAuth(); 