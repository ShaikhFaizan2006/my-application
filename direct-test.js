const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testDirectAuth() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/stockalertpro');
    console.log('Connected to MongoDB');

    // Create a test user with a direct password hash
    const plainPassword = 'directtest123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Delete any existing user with this email
    await User.deleteOne({ email: 'direct@example.com' });
    
    // Create the user with a directly hashed password
    const user = new User({
      fullName: 'Direct Test User',
      email: 'direct@example.com',
      password: hashedPassword,
      role: 'customer'
    });
    
    await user.save();
    console.log('Test user created with direct password hash');
    
    // Now test password comparison directly
    // Find the user with the password field
    const foundUser = await User.findOne({ email: 'direct@example.com' }).select('+password');
    
    if (!foundUser) {
      console.log('Error: User not found');
      return;
    }
    
    console.log('User found:', {
      id: foundUser._id,
      email: foundUser.email,
      passwordExists: !!foundUser.password
    });
    
    // Test password comparison
    console.log('Testing password comparison...');
    const correctResult = await bcrypt.compare(plainPassword, foundUser.password);
    console.log('Correct password comparison result:', correctResult);
    
    const wrongResult = await bcrypt.compare('wrongpassword', foundUser.password);
    console.log('Wrong password comparison result:', wrongResult);
    
    // Test the model's comparePassword method
    console.log('\nTesting model comparePassword method...');
    const modelCorrectResult = await foundUser.comparePassword(plainPassword);
    console.log('Model correct password result:', modelCorrectResult);
    
    const modelWrongResult = await foundUser.comparePassword('wrongpassword');
    console.log('Model wrong password result:', modelWrongResult);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('\nTest completed. You can now try logging in with:');
    console.log('Email: direct@example.com');
    console.log('Password: directtest123');
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDirectAuth(); 