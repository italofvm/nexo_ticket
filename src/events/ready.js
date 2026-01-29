const logger = require('../utils/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);
  },
};
