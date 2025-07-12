const Subscription = require('../models/Subscription');
const Product = require('../models/Product');

// @desc    Get all subscriptions for a user
// @route   GET /api/subscriptions
// @access  Private
exports.getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('product', 'name category price stock image');
    
    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Subscribe to a product
// @route   POST /api/subscriptions
// @access  Private
exports.createSubscription = async (req, res) => {
  try {
    const { productId, notifyAt } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      user: req.user.id,
      product: productId
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this product'
      });
    }
    
    // Create subscription
    const subscription = await Subscription.create({
      user: req.user.id,
      product: productId,
      notifyAt: notifyAt || 5 // Default to 5 if not specified
    });
    
    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update subscription notification threshold
// @route   PUT /api/subscriptions/:id
// @access  Private
exports.updateSubscription = async (req, res) => {
  try {
    const { notifyAt } = req.body;
    
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Make sure user owns subscription
    if (subscription.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this subscription'
      });
    }
    
    subscription.notifyAt = notifyAt;
    await subscription.save();
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unsubscribe from a product
// @route   DELETE /api/subscriptions/:id
// @access  Private
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Make sure user owns subscription
    if (subscription.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this subscription'
      });
    }
    
    await Subscription.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check user subscriptions for alerts
// @route   GET /api/subscriptions/alerts
// @access  Private
exports.getSubscriptionAlerts = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('product', 'name category price stock image');
    
    const alerts = subscriptions.filter(subscription => {
      const product = subscription.product;
      return product.stock <= subscription.notifyAt;
    });
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 