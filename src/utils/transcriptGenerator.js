const logger = require('./logger');

/**
 * Generates an HTML transcript of a Discord channel's messages.
 */
const generateHTML = async (channel) => {
  let messages = [];
  let lastId;

  // Fetch all messages (bypass 100 limit)
  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
    if (fetched.size < 100) break;
  }

  messages = messages.reverse();

  const htmlStart = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Transcrição - ${channel.name}</title>
        <style>
            body { background-color: #36393f; color: #dcddde; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
            .message { display: flex; margin-bottom: 20px; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; }
            .content { display: flex; flex-direction: column; }
            .header { display: flex; align-items: baseline; }
            .username { font-weight: bold; color: #fff; margin-right: 10px; }
            .timestamp { font-size: 0.75rem; color: #72767d; }
            .text { margin-top: 5px; line-height: 1.4; }
            .attachment { margin-top: 10px; max-width: 100%; border-radius: 4px; border: 1px solid #202225; }
        </style>
    </head>
    <body>
        <h1 style="color: #fff; border-bottom: 1px solid #4f545c; padding-bottom: 10px;">Transcrição: ${channel.name}</h1>
        <p style="color: #b9bbbe;">Servidor: ${channel.guild.name} | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <div class="messages">
  `;

  let htmlMessages = '';
  for (const msg of messages) {
    const avatar = msg.author.displayAvatarURL({ format: 'png', size: 128 });
    const username = msg.author.tag;
    const timestamp = msg.createdAt.toLocaleString('pt-BR');
    const text = msg.content.replace(/\n/g, '<br>');
    
    let attachments = '';
    msg.attachments.forEach(att => {
      if (att.contentType?.startsWith('image/')) {
        attachments += `<img src="${att.url}" class="attachment" alt="anexo">`;
      } else {
        attachments += `<div style="margin-top: 5px;"><a href="${att.url}" style="color: #00b0f4;">[Anexo: ${att.name}]</a></div>`;
      }
    });

    htmlMessages += `
      <div class="message">
        <img src="${avatar}" class="avatar" alt="avatar">
        <div class="content">
          <div class="header">
            <span class="username">${username}</span>
            <span class="timestamp">${timestamp}</span>
          </div>
          <div class="text">${text}</div>
          ${attachments}
        </div>
      </div>
    `;
  }

  const htmlEnd = `
        </div>
    </body>
    </html>
  `;

  return htmlStart + htmlMessages + htmlEnd;
};

/**
 * Generates a simple TXT transcript as fallback.
 */
const generateTXT = async (channel) => {
  let messages = [];
  let lastId;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
  }

  messages = messages.reverse();

  let txtContent = `TRANSCRICAO: ${channel.name}\nSERVIDOR: ${channel.guild.name}\nGERADO EM: ${new Date().toLocaleString('pt-BR')}\n\n`;

  for (const msg of messages) {
      const timestamp = msg.createdAt.toLocaleString('pt-BR');
      txtContent += `[${timestamp}] ${msg.author.tag}: ${msg.content}\n`;
      msg.attachments.forEach(att => {
          txtContent += `[ANEXO] ${att.url}\n`;
      });
  }

  return txtContent;
};

module.exports = {
  generateHTML,
  generateTXT
};
