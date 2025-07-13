const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function fixPasswordDirectly() {
  let client;
  
  try {
    // Connect directly to MongoDB
    console.log('Connecting to MongoDB...');
    const uri = 'mongodb://localhost:27017';
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('stockalertpro');
    const usersCollection = db.collection('users');
    
    // Create a password hash
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Created password hash:', hashedPassword);
    
    // Delete existing users
    await usersCollection.deleteMany({});
    console.log('Deleted all existing users');
    
    // Create users with the hashed password
    const users = [
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      },
      {
        fullName: 'Stocker User',
        email: 'stocker@example.com',
        password: hashedPassword,
        role: 'stocker',
        createdAt: new Date()
      },
      {
        fullName: 'Customer User',
        email: 'customer@example.com',
        password: hashedPassword,
        role: 'customer',
        createdAt: new Date()
      }
    ];
    
    // Insert users directly into MongoDB
    const result = await usersCollection.insertMany(users);
    console.log(`${result.insertedCount} users created with hashed password`);
    
    // Test the password comparison
    const user = await usersCollection.findOne({ email: 'customer@example.com' });
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison test result:', isMatch);
    
    console.log('\nUsers created successfully. You can now login with:');
    console.log('Email: admin@example.com, stocker@example.com, or customer@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

fixPasswordDirectly(); 