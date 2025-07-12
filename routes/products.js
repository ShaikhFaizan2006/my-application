const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Get low stock products
router.get('/lowstock', protect, authorize('admin', 'stocker'), getLowStockProducts);

// Get out of stock products
router.get('/outofstock', protect, authorize('admin', 'stocker'), getOutOfStockProducts);

// Get all products
router.get('/', getProducts);

// Get single product
router.get('/:id', getProduct);

// Create new product (admin & stocker only)
router.post('/', protect, authorize('admin', 'stocker'), createProduct);

// Update product (admin & stocker only)
router.put('/:id', protect, authorize('admin', 'stocker'), updateProduct);

// Delete product (admin only)
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router; 