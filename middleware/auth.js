const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify token
exports.protect = async (req, res, next) => {
  let token;
  
  try {
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check if token exists in cookies as fallback
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stock-alert-pro-secret-key');
    
    // Find user by ID from token with role but not password
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with this token no longer exists'
      });
    }
    
    // Add user info to request object
    req.user = user;
    req.user.id = user._id; // Ensure id is accessible in both formats
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    // Specific error for token expiration
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired. Please login again.'
      });
    }
    
    // Generic auth error for other cases
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please login again.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking authorization'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized for this resource.`
      });
    }
    
    next();
  };
}; 