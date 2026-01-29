const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`Bot logado como ${client.user.tag}`);
    
    try {
        const guild = client.guilds.cache.first();
        if (!guild) {
            console.log('Nenhum servidor encontrado.');
            process.exit(1);
        }

        console.log(`\nCanais no servidor: ${guild.name} (${guild.id})`);
        const channels = await guild.channels.fetch();
        const categories = channels.filter(c => c.type === ChannelType.GuildCategory);

        categories.forEach(cat => {
            console.log(`CATEGORIA: [${cat.name}] ID: ${cat.id}`);
        });

    } catch (err) {
        console.error('Erro ao buscar canais:', err);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_TOKEN);
