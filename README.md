# NexoTicket 🎫

**NexoTicket** é um bot de tickets para Discord avançado, construído com foco em segurança, performance e facilidade de uso. Utiliza as tecnologias mais modernas do ecossistema Node.js para garantir uma experiência premium tanto para administradores quanto para usuários finais.

## 🚀 Tecnologias Utilizadas

- **Runtime:** [Node.js](https://nodejs.org/) v20+
- **Library:** [Discord.js v14](https://discord.js.org/)
- **Banco de Dados:** [NeonDB (PostgreSQL)](https://neon.tech/)
- **Gestão de Ambiente:** [Dotenv](https://www.npmjs.com/package/dotenv)
- **Logger Profissional:** [Winston](https://www.npmjs.com/package/winston)
- **Hospedagem Recomendada:** [Railway](https://railway.app/)

## 🛠️ Configuração de Ambiente

Para rodar o projeto localmente, você precisará configurar as seguintes variáveis no seu arquivo `.env`:

```env
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=id_do_seu_bot
GUILD_ID=id_do_servidor_de_testes
DATABASE_URL=sua_url_do_neondb
```

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/NexoTicket.git
cd NexoTicket
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o `.env` seguindo o guia acima.

4. Inicie o bot:
```bash
# Modo de produção
npm start

# Modo de desenvolvimento
npm run dev
```

## 🎫 Sistema de Painéis

O sistema de painéis permite que administradores criem embeds interativos com botões para a abertura de tickets.

### Comandos de Administração

| Comando | Descrição |
|---------|-----------|
| `/panel create` | Cria um novo painel em um canal específico. |
| `/panel edit` | Edita as configurações de um painel existente. |
| `/panel delete` | Remove um painel e sua mensagem associada. |

### Estrutura do Banco de Dados (Painéis)

A tabela `panels` armazena as seguintes informações:
- `guild_id`: ID do servidor.
- `channel_id`: Canal onde o painel reside.
- `message_id`: ID da mensagem do embed.
- `title/description/color`: Configurações visuais.
- `button_label/button_emoji`: Configurações do botão.
- `category_id`: Onde os tickets serão abertos.

## 🛡️ Segurança
- **Prepared Statements:** Proteção total contra SQL Injection.
- **Permissões:** Apenas membros com a permissão `ADMINISTRATOR` podem gerenciar painéis.
- **Validação de Schema:** Verificação de variáveis de ambiente no boot.
- **Logger Masking:** Não logamos dados sensíveis (PII).
- **Rate Limit:** Cooldowns integrados para evitar abusos na API do Discord.

## 📄 Licença
...
