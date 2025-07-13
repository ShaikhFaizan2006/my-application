const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/stockalertpro');
    console.log('Connected to MongoDB');

    // Create a test user with a known password
    const password = 'test123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('Creating test user...');
    console.log('Password:', password);
    console.log('Hashed password:', hashedPassword);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('Password updated for test user');
    } else {
      // Create new user
      const user = new User({
        fullName: 'Test User',
        email: 'test@example.com',
        password: hashedPassword, // Set the hashed password directly
        role: 'customer'
      });
      
      await user.save();
      console.log('Test user created successfully');
    }
    
    // Verify the user was created
    const createdUser = await User.findOne({ email: 'test@example.com' });
    console.log('Created user:', {
      id: createdUser._id,
      email: createdUser.email,
      role: createdUser.role,
      password: createdUser.password // This should be the hashed password
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser(); 