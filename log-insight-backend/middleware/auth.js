const jwt = require('jsonwebtoken');
const { appLogger } = require('../logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    appLogger.warn('Access denied: No token provided', { ip: req.ip });
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    appLogger.warn('Invalid token', { ip: req.ip, error: error.message });
    res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
