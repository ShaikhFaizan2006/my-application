const express = require('express');
const {
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionAlerts
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All subscription routes are protected
router.use(protect);

// Get user subscriptions
router.get('/', getUserSubscriptions);

// Get subscription alerts
router.get('/alerts', getSubscriptionAlerts);

// Subscribe to product
router.post('/', createSubscription);

// Update subscription
router.put('/:id', updateSubscription);

// Unsubscribe from product
router.delete('/:id', deleteSubscription);

module.exports = router; 