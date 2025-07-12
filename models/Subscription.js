const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  notifyAt: {
    type: Number,
    required: [true, 'Please provide notification threshold'],
    default: 5,
    min: [1, 'Notification threshold must be at least 1']
  },
  dateSubscribed: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Prevent duplicate subscriptions
SubscriptionSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema); 