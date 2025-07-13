const mongoose = require('mongoose');

// Define order status options
const orderStatusOptions = [
  'Order Placed',
  'Payment Confirmed',
  'Order Processed',
  'Ready to Pickup',
  'In Transit',
  'Delivered',
  'Cancelled'
];

// Define schema for order status tracking
const OrderStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: orderStatusOptions,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String
  }
}, { _id: false });

// Define schema for order items
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

// Define main order schema
const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  statusHistory: [OrderStatusSchema],
  currentStatus: {
    type: String,
    enum: orderStatusOptions,
    required: true,
    default: 'Order Placed'
  },
  estimatedDelivery: {
    type: Date
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\+?[0-9\s-]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for current status with timestamp
OrderSchema.virtual('currentStatusWithTime').get(function() {
  if (!this.statusHistory.length) return null;
  
  const current = this.statusHistory.find(s => s.status === this.currentStatus);
  return current || this.statusHistory[this.statusHistory.length - 1];
});

// Method to add status update
OrderSchema.methods.addStatusUpdate = function(status, note = '') {
  if (!orderStatusOptions.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note
  });
  
  this.currentStatus = status;
  
  return this;
};

// Generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const prefix = date.getFullYear().toString().substr(-2) + 
                  (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `${prefix}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema); 