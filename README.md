# NexoTicket 🎫

[![Railway Deploy](https://raw.githubusercontent.com/railwayapp/core/master/assets/badge-light.svg)](https://railway.app/new)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![Tests](https://img.shields.io/badge/tests-21%20passing-success)
![Coverage](https://img.shields.io/badge/coverage-67%25-yellow)
![License](https://img.shields.io/badge/license-MIT-orange)

**NexoTicket** é uma solução enterprise-grade de tickets para Discord, com bot e dashboard web integrados.

## ✨ Funcionalidades

### Bot Discord
- 🎫 **Painéis de Tickets**: Embeds personalizados com botões para abertura
- ✋ **Gestão de Staff**: Assumir, transferir e gerenciar permissões em tempo real
- 📄 **Transcrições HTML**: Backups completos enviados por DM
- ⭐ **Avaliações**: Sistema 1-5 estrelas com feedback textual
- ⚙️ **Configuração Dinâmica**: Controle total via `/config`
- 📊 **Analytics**: Estatísticas globais e individuais via `/stats`

### Dashboard Web (Next.js 16)
- 🖥️ **Interface Premium**: Design moderno com Tailwind CSS
- 🔐 **Autenticação Discord**: Login via OAuth2
- 📋 **Gestão Visual**: Painéis, categorias e configurações em tempo real
- 📱 **Responsivo**: Funciona em desktop e mobile

## 🚀 Instalação

### Pré-requisitos
- Node.js v20+
- [Neon.tech](https://neon.tech/) (PostgreSQL Serverless)
- [Bot Discord](https://discord.com/developers/applications)

### Configuração Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/NexoTicket.git
cd NexoTicket

# Instale dependências
npm install
cd apps/web && npm install && cd ../..

# Configure as variáveis de ambiente
cp .env.example .env
cp apps/web/.env.example apps/web/.env
# Edite os arquivos .env com suas credenciais

# Execute as migrações
npm run migrate

# Inicie em modo de desenvolvimento
npm run dev                    # Bot
cd apps/web && npm run dev     # Dashboard (porta 3001)
```

## ⚙️ Variáveis de Ambiente

### Bot (`.env` na raiz)

| Variável | Descrição |
|----------|-----------|
| `DISCORD_TOKEN` | Token secreto do bot |
| `CLIENT_ID` | ID da aplicação |
| `GUILD_ID` | ID do servidor (desenvolvimento) |
| `DATABASE_URL` | URL de conexão NeonDB |
| `NODE_ENV` | `production` ou `development` |

### Dashboard (`apps/web/.env`)

| Variável | Descrição |
|----------|-----------|
| `NEXTAUTH_URL` | URL base (ex: `http://localhost:3001`) |
| `NEXTAUTH_SECRET` | Secret para JWT |
| `DISCORD_CLIENT_ID` | ID da aplicação OAuth |
| `DISCORD_CLIENT_SECRET` | Secret OAuth |
| `DATABASE_URL` | URL de conexão NeonDB |

## 📊 Comandos Disponíveis

### Administração
| Comando | Descrição |
|---------|-----------|
| `/config staff` | Gerencia cargos da equipe |
| `/config logs` | Define canal de auditoria |
| `/config rating` | Ativa/desativa avaliações |
| `/panel` | Cria/edita/deleta painéis |
| `/category` | Gerencia categorias de tickets |

### Utilidade
| Comando | Descrição |
|---------|-----------|
| `/stats global` | Dashboard geral |
| `/stats staff @user` | Performance de staff |
| `/stats user @user` | Histórico de usuário |
| `/ping` | Latência do bot |

## 🏗️ Estrutura do Projeto

```
NexoTicket/
├── apps/
│   ├── bot/               # Bot Discord (Node.js)
│   │   └── src/
│   │       ├── commands/  # Slash commands
│   │       ├── database/  # Queries e migrações
│   │       ├── events/    # Event handlers
│   │       ├── tests/     # Testes Jest
│   │       └── utils/     # Utilitários
│   └── web/               # Dashboard (Next.js 16)
│       └── src/
│           ├── app/       # App Router
│           ├── components/
│           └── lib/       # Auth e DB
├── packages/              # Código compartilhado
└── docs/                  # Documentação
```

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Cobertura atual
# Test Suites: 6 passed
# Tests:       21 passed
# Coverage:    67%
```

## 🚀 Deploy

### Railway (Recomendado)

1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente
3. O `railway.json` já está configurado

### Manual

```bash
# Build do dashboard
cd apps/web && npm run build

# Produção
npm run start          # Bot
npm run start          # Dashboard (porta 3001)
```

## 📈 Performance

- **Command Discovery**: Instantâneo (Lazy Loading)
- **Ticket Creation**: < 2s
- **Uso de Memória**: ~80-120MB em idle
- **Database Latency**: Otimizada via índices

## 🛡️ Segurança

- **Graceful Shutdown**: Finalização limpa ao receber SIGTERM
- **Cache Inteligente**: TTL de 5 minutos para configurações
- **Logs Estruturados**: Winston com rotação
- **Rate Limiting**: Proteção contra spam

## 📄 Licença

MIT - Veja [LICENSE](./LICENSE)

---

Desenvolvido por **Nexo** 🎫
