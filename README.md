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

## 🛡️ Segurança

Este projeto adota práticas rigorosas de segurança:
- **Prepared Statements:** Proteção total contra SQL Injection.
- **Validação de Schema:** Verificação de variáveis de ambiente no boot.
- **Logger Masking:** Não logamos dados sensíveis (PII).
- **Rate Limit:** Cooldowns integrados para evitar abusos na API do Discord.

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
