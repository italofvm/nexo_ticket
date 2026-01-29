const { Events } = require('discord.js');
const { getGuildConfig } = require('../database/repositories/configRepository');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      const config = await getGuildConfig(member.guild.id);
      
      if (config && config.visitor_role_id) {
        const role = member.guild.roles.cache.get(config.visitor_role_id);
        if (role) {
          await member.roles.add(role).catch(err => {
            logger.error(`Failed to assign visitor role to ${member.user.tag}: ${err.message}`);
          });
          logger.info(`Assigning visitor role to new member: ${member.user.tag}`);
        } else {
          logger.warn(`Visitor role ID ${config.visitor_role_id} configured but not found in guild ${member.guild.name}`);
        }
      }
    } catch (err) {
      logger.error(`Error in guildMemberAdd event: ${err.message}`);
    }
  },
};
