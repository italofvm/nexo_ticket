

const DISCORD_API = "https://discord.com/api/v10";

export interface PartialGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export function getIconUrl(guild: PartialGuild) {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}

export async function getUserGuilds(accessToken: string): Promise<PartialGuild[]> {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user guilds");
  }

  const guilds: PartialGuild[] = await response.json();

  // Filter for guilds where user has MANAGE_GUILD or ADMINISTRATOR
  return guilds.filter((guild) => {
    // Check for ADMINISTRATOR (0x8) or MANAGE_GUILD (0x20)
    // Using simple bitwise check as database/serverless env might not have full discord.js heavy deps
    // 0x8 = 8, 0x20 = 32
    const permissions = BigInt(guild.permissions);
    const ADMIN = BigInt(0x8);
    const MANAGE_GUILD = BigInt(0x20);

    return (permissions & ADMIN) === ADMIN || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
  });
}

// ... imports

export interface PartialChannel {
  id: string;
  name: string;
  type: number;
}

export async function getGuildChannels(guildId: string, accessToken: string): Promise<PartialChannel[]> {
    // NOTE: This endpoint requires the Bot Token if the user token lacks permissions or scope.
    // However, usually "bot" scope allows the bot to see channels, but the DASHBOARD acts as user?
    // If we use User Token, we need "guilds" scope (which we have) but wait...
    // /guilds/{guild.id}/channels usually requires bot token or high priv user token.
    // Let's use BOT TOKEN for reliability since the bot is in the guild.
    
    try {
        if (!guildId || guildId === "undefined") {
          console.error("❌ getGuildChannels called with invalid guildId:", guildId);
          return [];
        }
        
        const response = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
          },
          cache: "no-store"
        });
      
        if (!response.ok) {
            console.error("Failed to fetch channels", await response.text());
            return [];
        }
      
        const channels: PartialChannel[] = await response.json();
        
        // Filter for Text Channels (0) and Announcement Channels (5)
        return channels.filter(c => c.type === 0 || c.type === 5);
    } catch (error) {
        console.error("Exception in getGuildChannels:", error);
        return [];
    }
}

export async function sendDiscordMessage(channelId: string, payload: any) {
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send Discord message:", errorText);
    throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function deleteDiscordChannel(channelId: string) {
  const response = await fetch(`${DISCORD_API}/channels/${channelId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    console.error(`Failed to delete Discord channel ${channelId}:`, errorText);
    throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
  }

  return true;
}

export async function bulkDeleteMessages(channelId: string, messageIds: string[]) {
  if (messageIds.length === 0) return true;
  
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages/bulk-delete`, {
    method: "POST",
    headers: {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages: messageIds })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to bulk delete messages in ${channelId}:`, errorText);
    throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
  }

  return true;
}

export async function getChannelMessages(channelId: string, limit: number = 100) {
  const response = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`, {
    headers: {
      "Authorization": `Bot ${process.env.DISCORD_TOKEN}`,
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch messages in ${channelId}:`, errorText);
    throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
