const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Subscription = require('./models/Subscription');
const Cart = require('./models/Cart');

// Load env variables
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stockalertpro')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Sample Data
const products = [
  {
    name: 'Adidas Sneakers',
    category: 'Fashion',
    price: 99.99,
    stock: 15,
    image: '👟',
    rating: 4.5,
  },
  {
    name: 'Nike T-Shirt',
    category: 'Fashion',
    price: 29.99,
    stock: 8,
    image: '👕',
    rating: 4.2,
  },
  {
    name: 'Apple Watch',
    category: 'Electronics',
    price: 399.99,
    stock: 5,
    image: '⌚',
    rating: 4.7,
  },
  {
    name: 'Wireless Earbuds',
    category: 'Electronics',
    price: 89.99,
    stock: 3,
    image: '🎧',
    rating: 4.0,
  },
  {
    name: 'GAP T-Shirt',
    category: 'Fashion',
    price: 39.99,
    stock: 25,
    image: '👚',
    rating: 3.9,
  },
  {
    name: 'Samsung Tablet',
    category: 'Electronics',
    price: 249.99,
    stock: 0,
    image: '📱',
    rating: 4.3,
  },
  {
    name: 'Leather Wallet',
    category: 'Accessories',
    price: 49.99,
    stock: 12,
    image: '👛',
    rating: 4.1,
  },
  {
    name: 'Desk Lamp',
    category: 'Home',
    price: 24.99,
    stock: 7,
    image: '💡',
    rating: 3.8,
  }
];

const users = [
  {
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
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

// Sample order data creator function
const createOrders = (customerId, productsList) => {
  const orderStatuses = [
    'Order Placed',
    'Payment Confirmed',
    'Order Processed',
    'Ready to Pickup',
    'In Transit',
    'Delivered'
  ];

  // Create sample orders
  const orders = [];
  
  // Create 3 orders with different statuses
  for (let i = 0; i < 3; i++) {
    // Select 1-3 random products for this order
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    const usedIndices = new Set();
    
    for (let j = 0; j < itemCount; j++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * productsList.length);
      } while (usedIndices.has(randomIndex));
      
      usedIndices.add(randomIndex);
      const product = productsList[randomIndex];
      selectedProducts.push({
        product: product._id,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: product.price
      });
    }
    
    // Calculate total
    const totalAmount = selectedProducts.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Create status history (more items for older orders)
    const currentStatusIndex = Math.min(i + 2, orderStatuses.length - 1);
    const statusHistory = [];
    
    // Create a date for the order (older orders first)
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - (3 - i) * 2); // 6, 4, and 2 days ago
    
    // Add status history entries
    for (let k = 0; k <= currentStatusIndex; k++) {
      const statusDate = new Date(orderDate);
      statusDate.setHours(statusDate.getHours() + k * 2); // 2 hours between statuses
      
      statusHistory.push({
        status: orderStatuses[k],
        timestamp: statusDate,
        note: k === 0 ? 'Order received successfully.' : 
              k === orderStatuses.length - 1 ? 'Your order has been delivered.' : 
              `Order status updated to ${orderStatuses[k]}.`
      });
    }
    
    const currentStatus = orderStatuses[currentStatusIndex];
    
    // Create estimated delivery date (24 hours from order date)
    const estimatedDelivery = new Date(orderDate);
    estimatedDelivery.setHours(estimatedDelivery.getHours() + 24);
    
    // Create the order object
    orders.push({
      user: customerId,
      orderNumber: `${orderDate.getFullYear().toString().slice(-2)}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      items: selectedProducts,
      totalAmount,
      statusHistory,
      currentStatus,
      estimatedDelivery,
      phoneNumber: '+1 555-123-4567',
      deliveryAddress: {
        street: '1234 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      },
      createdAt: orderDate
    });
  }
  
  return orders;
};

// Import data to DB
const importData = async () => {
  try {
    // Clear Database
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Subscription.deleteMany();
    await Cart.deleteMany();
    
    console.log('Data cleared...');

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    
    const adminUser = createdUsers[0]._id;
    const stockerUser = createdUsers[1]._id;
    const customerUser = createdUsers[2]._id;

    // Add user ref to products
    const productsWithUser = products.map((product) => {
      return { ...product, user: adminUser };
    });

    // Insert products
    const createdProducts = await Product.insertMany(productsWithUser);
    console.log(`${createdProducts.length} products created`);

    // Create and insert orders for customer
    const orders = createOrders(customerUser, createdProducts);
    const createdOrders = await Order.insertMany(orders);
    console.log(`${createdOrders.length} orders created`);

    // Create empty cart for customer
    await Cart.create({
      user: customerUser,
      items: []
    });
    console.log('Customer cart created');

    // Create subscriptions for customer (subscribe to first 2 products)
    const subscriptions = [
      {
        user: customerUser,
        product: createdProducts[0]._id,
        notifyAt: 5,
        active: true
      }
    ];
    
    await Subscription.insertMany(subscriptions);
    console.log(`${subscriptions.length} subscriptions created`);

    console.log('Data Import Success!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Subscription.deleteMany();
    await Cart.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Run function based on command argument
if (process.argv[2] === '-d') {
  deleteData();
} else if (process.argv[2] === '-i') {
  importData();
} else {
  console.log('Please use -i (import) or -d (destroy) as arguments');
  process.exit();
} 