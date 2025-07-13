const express = require('express');
const router = express.Router();
const { 
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All routes in this file require authentication
router.use(protect);

// Routes for customers
router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);

// Routes for admin and stocker
router.patch('/:id/status', authorize('admin', 'stocker'), updateOrderStatus);

module.exports = router; 