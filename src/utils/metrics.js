const logger = require('./logger');

const metrics = {
  ticketsOpened: 0,
  ticketsClosed: 0,
  commandsExecuted: 0,
  errorsCount: 0,
  startTime: Date.now()
};

/**
 * Increments a specific metric.
 */
const incMetric = (name) => {
  if (metrics.hasOwnProperty(name)) {
    metrics[name]++;
  }
};

/**
 * Returns current metrics and uptime.
 */
const getMetrics = () => {
  return {
    ...metrics,
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
  };
};

/**
 * Helper to log periodic performance.
 */
const startPeriodicReport = (intervalMs = 3600000) => { // Default 1 hour
    setInterval(() => {
        const m = getMetrics();
        logger.info('--- Periodic Metrics Report ---');
        logger.info(`Uptime: ${m.uptime}s | Commands: ${m.commandsExecuted} | Tickets Open/Close: ${m.ticketsOpened}/${m.ticketsClosed} | Errors: ${m.errorsCount}`);
    }, intervalMs);
};

module.exports = {
  incMetric,
  getMetrics,
  startPeriodicReport
};
