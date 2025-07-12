const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All cart routes are protected
router.use(protect);

// Get user cart and Clear cart
router
  .route('/')
  .get(getCart)
  .delete(clearCart);

// Add to cart
router.post('/', addToCart);

// Update cart item and Remove cart item
router
  .route('/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

module.exports = router; 