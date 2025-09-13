const fs = require('fs');
const path = require('path');
const { logDir } = require('../logger');

class LogService {
  constructor() {
    this.logTypes = {
      general: 'general.log',
      login: 'login.log',
      tokens: 'tokens.log',
      app: 'app.log'
    };
  }

  // Read logs from a specific file with pagination and search
  async getLogs(logType = 'general', page = 1, limit = 50, search = '', startDate = null, endDate = null) {
    try {
      const logFile = this.logTypes[logType];
      if (!logFile) {
        throw new Error('Invalid log type');
      }

      const filePath = path.join(logDir, logFile);
      
      if (!fs.existsSync(filePath)) {
        return { logs: [], total: 0, page, totalPages: 0 };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let lines = content.split('\n').filter(line => line.trim());

      // Parse JSON logs and filter
      let logs = [];
      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          
          // Date filtering
          if (startDate || endDate) {
            const logDate = new Date(logEntry.time);
            if (startDate && logDate < new Date(startDate)) continue;
            if (endDate && logDate > new Date(endDate)) continue;
          }

          // Search filtering
          if (search && !JSON.stringify(logEntry).toLowerCase().includes(search.toLowerCase())) {
            continue;
          }

          logs.push(logEntry);
        } catch (e) {
          // Skip invalid JSON lines
          continue;
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Pagination
      const total = logs.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedLogs = logs.slice(startIndex, startIndex + limit);

      return {
        logs: paginatedLogs,
        total,
        page: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      };
    } catch (error) {
      throw new Error(`Failed to read logs: ${error.message}`);
    }
  }

  // Delete logs based on conditions
  async deleteLogs(logType = 'general', conditions = {}) {
    try {
      const logFile = this.logTypes[logType];
      if (!logFile) {
        throw new Error('Invalid log type');
      }

      const filePath = path.join(logDir, logFile);
      
      if (!fs.existsSync(filePath)) {
        return { deletedCount: 0 };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let lines = content.split('\n').filter(line => line.trim());

      let remainingLogs = [];
      let deletedCount = 0;

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          let shouldDelete = false;

          // Check date conditions
          if (conditions.startDate || conditions.endDate) {
            const logDate = new Date(logEntry.time);
            if (conditions.startDate && logDate >= new Date(conditions.startDate) &&
                conditions.endDate && logDate <= new Date(conditions.endDate)) {
              shouldDelete = true;
            } else if (conditions.startDate && !conditions.endDate && logDate >= new Date(conditions.startDate)) {
              shouldDelete = true;
            } else if (!conditions.startDate && conditions.endDate && logDate <= new Date(conditions.endDate)) {
              shouldDelete = true;
            }
          }

          // Check search conditions
          if (conditions.search && JSON.stringify(logEntry).toLowerCase().includes(conditions.search.toLowerCase())) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            deletedCount++;
          } else {
            remainingLogs.push(line);
          }
        } catch (e) {
          // Keep invalid JSON lines
          remainingLogs.push(line);
        }
      }

      // Write back the remaining logs
      fs.writeFileSync(filePath, remainingLogs.join('\n') + (remainingLogs.length > 0 ? '\n' : ''));

      return { deletedCount };
    } catch (error) {
      throw new Error(`Failed to delete logs: ${error.message}`);
    }
  }

  // Get log statistics
  async getLogStats() {
    try {
      const stats = {};
      
      for (const [type, filename] of Object.entries(this.logTypes)) {
        const filePath = path.join(logDir, filename);
        if (fs.existsSync(filePath)) {
          const fileStats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          stats[type] = {
            count: lines.length,
            size: fileStats.size,
            lastModified: fileStats.mtime
          };
        } else {
          stats[type] = {
            count: 0,
            size: 0,
            lastModified: null
          };
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to get log stats: ${error.message}`);
    }
  }
}

module.exports = new LogService();
