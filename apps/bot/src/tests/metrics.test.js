const { incMetric, getMetrics } = require('../utils/metrics');

describe('Metrics', () => {
  describe('incMetric', () => {
    it('should increment existing metrics', () => {
      const initialMetrics = getMetrics();
      const initialCommandsExecuted = initialMetrics.commandsExecuted;
      
      incMetric('commandsExecuted');
      
      const newMetrics = getMetrics();
      expect(newMetrics.commandsExecuted).toBe(initialCommandsExecuted + 1);
    });

    it('should not throw for unknown metric names', () => {
      expect(() => {
        incMetric('unknownMetric');
      }).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object with uptime', () => {
      const metrics = getMetrics();
      
      expect(metrics).toHaveProperty('ticketsOpened');
      expect(metrics).toHaveProperty('ticketsClosed');
      expect(metrics).toHaveProperty('commandsExecuted');
      expect(metrics).toHaveProperty('errorsCount');
      expect(metrics).toHaveProperty('uptime');
    });

    it('should calculate uptime based on startTime', () => {
      const metrics = getMetrics();
      
      expect(typeof metrics.uptime).toBe('number');
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
