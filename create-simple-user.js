const mongoose = require('mongoose');
const User = require('./models/User');

async function createSimpleUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/stockalertpro');
    console.log('Connected to MongoDB');

    // Delete existing users with the same email
    await User.deleteOne({ email: 'simple@example.com' });
    console.log('Deleted any existing users with the same email');

    // Create a new user with a simple password
    const user = new User({
      fullName: 'Simple User',
      email: 'simple@example.com',
      password: 'simple123', // This will be hashed by the pre-save hook
      role: 'customer'
    });
    
    // Save the user
    await user.save();
    console.log('User created successfully');
    
    // Verify the user was created (without password)
    const createdUser = await User.findOne({ email: 'simple@example.com' });
    console.log('Created user:', {
      id: createdUser._id,
      email: createdUser.email,
      role: createdUser.role
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('\nYou can now test login with:');
    console.log('Email: simple@example.com');
    console.log('Password: simple123');
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createSimpleUser(); 