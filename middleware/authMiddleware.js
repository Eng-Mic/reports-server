const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Token = require("../models/Token");
const User = require("../models/User");

// Protect routes middleware
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Check if token is blacklisted
            const blacklistedToken = await Token.findOne({ token });
            if (blacklistedToken) {
                return res.status(401).json({ message: 'Token has been invalidated, please login again' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            // Update last active
            if (req.user) {
                req.user.lastActive = new Date();
                await req.user.save();
            }

            return next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // No token provided
    return res.status(401).json({ message: 'Not authorized, no token' });
});



// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

const adminOrManager = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as admin or manager' });
    }
  };

module.exports = { protect, admin, adminOrManager };
