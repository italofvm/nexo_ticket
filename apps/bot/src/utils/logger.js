const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'nexoticket' },
  transports: [
    // We always log to console in production for Railway/Docker logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          let log = `${timestamp} ${level}: ${stack || message}`;
          if (Object.keys(meta).length > 1) { // 1 because service: nexoticket is default
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      ),
    })
  ],
});

// File logging only if not in a containerized environment like Railway 
if (process.env.RAILWAY_ENVIRONMENT === undefined && process.env.NODE_ENV !== 'test') {
  const errorLogPath = path.join(__dirname, '../../logs/error.log');
  const combinedLogPath = path.join(__dirname, '../../logs/combined.log');
  
  logger.add(new winston.transports.File({ 
    filename: errorLogPath, 
    level: 'error',
    maxsize: 5242880, 
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({ 
    filename: combinedLogPath,
    maxsize: 5242880, 
    maxFiles: 5,
  }));
  
  logger.info(`File logging enabled. Error log: ${errorLogPath}, Combined log: ${combinedLogPath}`);
}

module.exports = logger;
