const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockalertpro');

// Sample users
const users = [
  {
    fullName: 'Admin User',
    email: 'faizanshaikh@gmail.com',
    password: 'faizan@admin',
    role: 'admin'
  },
  {
    fullName: 'Stocker User',
    email: 'stocker@example.com',
    password: 'password123',
    role: 'stocker'
  },
  {
    fullName: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer'
  }
];

// Sample products
const products = [
  {
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    price: 999,
    stock: 2,
    image: '📱',
    rating: 4.8,
    lowStockThreshold: 5
  },
  {
    name: 'Samsung 4K TV',
    category: 'Electronics',
    price: 599,
    stock: 8,
    image: '📺',
    rating: 4.5,
    lowStockThreshold: 5
  },
  {
    name: 'Nike Air Max',
    category: 'Fashion',
    price: 129,
    stock: 12,
    image: '👟',
    rating: 4.2,
    lowStockThreshold: 5
  },
  {
    name: 'Instant Pot',
    category: 'Kitchen',
    price: 89,
    stock: 15,
    image: '🍲',
    rating: 4.7,
    lowStockThreshold: 5
  },
  {
    name: 'MacBook Pro',
    category: 'Electronics',
    price: 1299,
    stock: 0,
    image: '💻',
    rating: 4.9,
    lowStockThreshold: 5
  },
  {
    name: 'Adidas Shoes',
    category: 'Fashion',
    price: 99,
    stock: 15,
    image: '👟',
    rating: 4.3,
    lowStockThreshold: 5
  },
  {
    name: 'Yoga Mat',
    category: 'Fitness',
    price: 59,
    stock: 3,
    image: '🧘',
    rating: 4.1,
    lowStockThreshold: 5
  },
  {
    name: 'GAP T-Shirt',
    category: 'Fashion',
    price: 39,
    stock: 25,
    image: '👕',
    rating: 3.9,
    lowStockThreshold: 5
  },
  {
    name: 'Wall Clock',
    category: 'Accessories',
    price: 99,
    stock: 0,
    image: '🕐',
    rating: 4.0,
    lowStockThreshold: 5
  },
  {
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 79,
    stock: 6,
    image: '🔊',
    rating: 4.4,
    lowStockThreshold: 5
  }
];

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    
    console.log('Data cleared...');
    
    // Create users
    await User.create(users);
    console.log('Users imported...');
    
    // Create products
    await Product.create(products);
    console.log('Products imported...');
    
    console.log('Data import completed!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Delete all data from DB
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    
    console.log('All data deleted!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Check command line args
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use either -i (import) or -d (delete) as command line argument');
  process.exit();
} 