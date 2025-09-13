require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { appLogger, loginLogger, tokenLogger, generalLogger } = require('./logger');
const { authenticateToken } = require('./middleware/auth');
const logService = require('./services/logService');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'http://localhost:3000' : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  appLogger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      appLogger.warn('Login attempt with missing credentials', { ip: req.ip });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check credentials against environment variables
    if (username !== process.env.ADMIN_USERNAME) {
      appLogger.warn('Login attempt with invalid username', { username, ip: req.ip });
      loginLogger.info('Failed login attempt', { username, ip: req.ip, reason: 'Invalid username' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For production, you should hash the password in .env file
    if (password !== process.env.ADMIN_PASSWORD) {
      appLogger.warn('Login attempt with invalid password', { username, ip: req.ip });
      loginLogger.info('Failed login attempt', { username, ip: req.ip, reason: 'Invalid password' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, userId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    appLogger.info('Successful login', { username, ip: req.ip });
    loginLogger.info('Successful login', { username, ip: req.ip, timestamp: new Date().toISOString() });

    res.json({
      token,
      user: { username },
      expiresIn: '24h'
    });
  } catch (error) {
    appLogger.error('Login error', { error: error.message, ip: req.ip });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// General log API (no authentication required)
app.post('/api/logs/general', (req, res) => {
  try {
    const { level = 'info', message, data = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const logData = {
      level,
      message,
      data,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    generalLogger[level] || generalLogger.info(logData);
    
    res.json({ success: true, message: 'Log recorded' });
  } catch (error) {
    appLogger.error('Error recording general log', { error: error.message });
    res.status(500).json({ error: 'Failed to record log' });
  }
});

// Token usage API (no authentication required)
app.post('/api/logs/tokens', (req, res) => {
  try {
    const { 
      model, 
      promptTokens, 
      completionTokens, 
      totalTokens, 
      requestId,
      userId,
      endpoint,
      duration 
    } = req.body;

    if (!model || totalTokens === undefined) {
      return res.status(400).json({ error: 'Model and totalTokens are required' });
    }

    const tokenData = {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      requestId,
      userId,
      endpoint,
      duration,
      ip: req.ip,
      timestamp: new Date().toISOString()
    };

    tokenLogger.info('Token usage recorded', tokenData);
    
    res.json({ success: true, message: 'Token usage recorded' });
  } catch (error) {
    appLogger.error('Error recording token usage', { error: error.message });
    res.status(500).json({ error: 'Failed to record token usage' });
  }
});

// Protected routes (require authentication)

// Get logs with search and pagination
app.get('/api/logs/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      startDate, 
      endDate 
    } = req.query;

    const result = await logService.getLogs(type, page, limit, search, startDate, endDate);
    res.json(result);
  } catch (error) {
    appLogger.error('Error fetching logs', { error: error.message, type: req.params.type });
    res.status(500).json({ error: error.message });
  }
});

// Delete logs
app.delete('/api/logs/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const conditions = req.body;

    const result = await logService.deleteLogs(type, conditions);
    
    appLogger.info('Logs deleted', { 
      type, 
      conditions, 
      deletedCount: result.deletedCount,
      user: req.user.username 
    });
    
    res.json(result);
  } catch (error) {
    appLogger.error('Error deleting logs', { error: error.message, type: req.params.type });
    res.status(500).json({ error: error.message });
  }
});

// Get log statistics
app.get('/api/logs-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await logService.getLogStats();
    res.json(stats);
  } catch (error) {
    appLogger.error('Error fetching log stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  appLogger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method 
  });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  appLogger.info(`Server running on port ${PORT}`, { 
    port: PORT, 
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
