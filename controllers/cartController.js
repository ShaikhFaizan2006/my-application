const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name category price stock image');
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product has enough stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Only ${product.stock} available.`
      });
    }
    
    // Find user cart or create one
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }]
      });
    } else {
      // Check if item is already in cart
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );
      
      if (itemIndex > -1) {
        // Update existing item quantity
        const newQuantity = cart.items[itemIndex].quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Cannot add ${quantity} more. Only ${product.stock - cart.items[itemIndex].quantity} more available.`
          });
        }
        
        cart.items[itemIndex].quantity = newQuantity;
      } else {
        // Add new item to cart
        cart.items.push({ product: productId, quantity });
      }
      
      // Save updated cart
      cart.updatedAt = Date.now();
      await cart.save();
    }
    
    // Return the cart with populated product information
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name category price stock image');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product has enough stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Only ${product.stock} available.`
      });
    }
    
    // Find user cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Check if item is in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart'
      });
    }
    
    // Update item quantity
    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    
    await cart.save();
    
    // Return the cart with populated product information
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name category price stock image');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Find user cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Filter out the item to remove
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    // Return the updated cart
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name category price stock image');
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Empty the cart
    cart.items = [];
    cart.updatedAt = Date.now();
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 