const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create file streams
const createFileStream = (filename) => {
  return pino.destination({
    dest: path.join(logDir, filename),
    sync: false,
    append: true,
    mkdir: true
  });
};

// General application logger
const appLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, createFileStream('app.log'));

// Login events logger
const loginLogger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, createFileStream('login.log'));

// Token usage logger
const tokenLogger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, createFileStream('tokens.log'));

// General logs logger
const generalLogger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, createFileStream('general.log'));

module.exports = {
  appLogger,
  loginLogger,
  tokenLogger,
  generalLogger,
  logDir
};
