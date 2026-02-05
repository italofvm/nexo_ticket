const { Events } = require('discord.js');
const { logAction } = require('../utils/logHandler');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      await logAction(member.guild, 'MEMBER_LEAVE', member.user, {
        memberTag: member.user.tag,
        memberId: member.id,
        joinedAt: member.joinedAt,
      });
      
      logger.info(`Member left: ${member.user.tag} from ${member.guild.name}`);
    } catch (err) {
      logger.error(`Error in guildMemberRemove event: ${err.message}`);
    }
  },
};
