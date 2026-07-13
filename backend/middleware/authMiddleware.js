const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // 1. Read the token from the header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'No token provided' });

  // 2. Verify and decode the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token invalid or expired' });

    req.user = decoded; // attach { id, role } to request
    next();             // pass control to the next handler
  });
};


  
  const authorize = (...allowedRoles) => (req, res, next) => {

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};



module.exports = { protect, authorize };