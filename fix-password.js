const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// This script creates a user with a known password hash that will work with our system
async function createFixedUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/stockalertpro');
    console.log('Connected to MongoDB');

    // Create a fixed password hash for "password123"
    // This is a known working hash for "password123" using bcrypt
    const fixedPasswordHash = '$2a$10$NrPE/kBiMbzxEU2KwcQLpuXg.WMRhU0rjPMjcFzJ4zGK7GmGJCTLa';
    
    // Delete existing users
    await User.deleteMany({});
    console.log('Deleted all existing users');
    
    // Create users with the fixed password hash
    const users = [
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: fixedPasswordHash,
        role: 'admin'
      },
      {
        fullName: 'Stocker User',
        email: 'stocker@example.com',
        password: fixedPasswordHash,
        role: 'stocker'
      },
      {
        fullName: 'Customer User',
        email: 'customer@example.com',
        password: fixedPasswordHash,
        role: 'customer'
      }
    ];
    
    // Insert users directly to bypass the pre-save hook
    await User.insertMany(users);
    console.log('Created users with fixed password hash');
    
    // Test the password comparison
    const user = await User.findOne({ email: 'customer@example.com' }).select('+password');
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log('Password comparison test result:', isMatch);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('\nUsers created successfully. You can now login with:');
    console.log('Email: admin@example.com, stocker@example.com, or customer@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error:', error);
  }
}

createFixedUser(); 