// Simple authentication test using fetch
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
  console.log('Testing login with customer@example.com / password123');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', data);
    
    return data;
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin(); 