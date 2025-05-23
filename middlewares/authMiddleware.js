const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT tokens
const auth = (req, res, next) => {
  // Extract token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If token is missing, deny access
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    // Verify token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object for downstream access
    req.user = {
      userId: decoded.userId,
      email: decoded.email  
    };

    next(); // Proceed to next middleware 
  } catch (err) {
    // Token is invalid or expired
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
