const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Create a new order from the user's cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress, phoneNumber } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Your cart is empty'
      });
    }

    // Calculate total and prepare order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    const totalAmount = cart.items.reduce(
      (total, item) => total + (item.product.price * item.quantity),
      0
    );

    // Create new order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      phoneNumber, // Include phone number
      statusHistory: [
        { status: 'Order Placed' }
      ]
    });

    // Set estimated delivery (15 min from now for demo purposes)
    const estimatedDelivery = new Date();
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 15);
    order.estimatedDelivery = estimatedDelivery;

    await order.save();

    // Clear the user's cart after order is created
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get all orders for the current user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .populate('items.product', 'name image category price');
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name image price category')
      .populate('user', 'fullName email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if the order belongs to the current user (unless admin)
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update order status (admin or stocker only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only admin or stocker can update order status
    if (!['admin', 'stocker'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update order status'
      });
    }

    // Update order status
    order.addStatusUpdate(status, note);
    await order.save();

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
}; 