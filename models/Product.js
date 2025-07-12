const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide category'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide price'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  image: {
    type: String,
    default: '📦' // Default emoji
  },
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if product is low on stock
ProductSchema.methods.isLowStock = function() {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
};

// Method to check if product is out of stock
ProductSchema.methods.isOutOfStock = function() {
  return this.stock === 0;
};

module.exports = mongoose.model('Product', ProductSchema); 