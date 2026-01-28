# NexoTicket 🎫

[![Railway Deploy](https://raw.githubusercontent.com/railwayapp/core/master/assets/badge-light.svg)](https://railway.app/new)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

**NexoTicket** é uma solução enterprise-grade de tickets para Discord, projetada para alta performance, segurança robusta e experiência de usuário premium.

## ✨ Funcionalidades Principais

- 🎫 **Sistema de Painéis:** Crie embeds personalizados com botões para abertura de tickets.
- ✋ **Gestão de Staff:** Comandos para assumir, transferir e gerenciar permissões em tempo real.
- 📄 **Transcrições HTML:** Backups completos e estilizados enviados por DM e salvos em banco.
- ⭐ **Satisfação do Cliente:** Sistema de avaliação (rating) 1-5 estrelas com feedback textual.
- ⚙️ **Configuração Dinâmica:** Controle total via `/config` (logs, welcome messages, ratings).
- 📊 **Dashboard de Analytics:** Estatísticas globais e individuais via `/stats`.
- 🛡️ **Pronto para Produção:** Graceful shutdown, cache inteligente, monitoramento e índices de performance.

## 🚀 Como Começar

### Pré-requisitos
- Node.js v20 ou superior.
- Uma conta no [Neon.tech](https://neon.tech/) (PostgreSQL Serverless).
- Um Bot no [Portal de Desenvolvedores do Discord](https://discord.com/developers/applications).

### Instalação Local
1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/NexoTicket.git
cd NexoTicket
```
2. Instale as dependências:
```bash
npm install
```
3. Configure o `.env` (use `.env.example` como base).
4. Rode as migrações e o bot em modo dev:
```bash
npm run dev
```

### Deploy no Railway
O NexoTicket vem pré-configurado para o **Railway**:
1. Conecte seu repositório GitHub ao Railway.
2. Adicione as variáveis de ambiente necessárias (`DISCORD_TOKEN`, `DATABASE_URL`, etc.).
3. O Railway usará automaticamente o `railway.json` e o `npm start` (que roda as migrações e inicia o bot).

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `DISCORD_TOKEN` | Token secreto do seu bot Discord. | Sim |
| `CLIENT_ID` | ID da aplicação do bot. | Sim |
| `GUILD_ID` | ID do servidor para registro de comandos (dev). | Sim |
| `DATABASE_URL` | URL de conexão do NeonDB (PostgreSQL). | Sim |
| `NODE_ENV` | `production` ou `development`. | Não |
| `PORT` | Porta para o healthcheck HTTP. | Não |

## 📊 Comandos Disponíveis

### Administração
- `/config staff`: Gerencia cargos da equipe.
- `/config logs`: Define o canal de auditoria.
- `/config welcome`: Define a mensagem de boas-vindas dos tickets.
- `/config rating`: Ativa/desativa avaliações dos usuários.
- `/panel`: Cria, edita ou deleta painéis de atendimento.

### Utilidade
- `/stats global`: Dashboard geral do servidor.
- `/stats staff`: Performance de um membro específico.
- `/stats user`: Histórico de um usuário.
- `/ping`: Verifica a latência do bot e da API.

## 🏗️ Estrutura do Projeto

```text
/src
  /commands     - Comandos Slash organizados por categoria
  /database     - Camada de persistência e migrations
  /events       - Handlers de eventos do Discord
  /utils        - Utilitários de lógica, logs, cache e métricas
  index.js      - Ponto de entrada (Bootstrap & Resilience)
```

## 📈 Performance Benchmarks (Estimativas)

- **Command Discovery:** Instantâneo (Lazy Loading metadados).
- **Ticket Creation:** < 2s (incluindo permissões e DB persistence).
- **Uso de Memória:** ~80-120MB em idle.
- **Database Latency:** Otimizada via índices compostos.

## 🛡️ Segurança e Resiliência

- **Graceful Shutdown:** O bot finaliza conexões e destrói o cliente Discord de forma limpa ao receber SIGTERM.
- **Cache Inteligente:** TTL de 5 minutos para permissões e configurações, reduzindo custos de DB.
- **Monitoramento:** Logs estruturados com Winston e relatórios periódicos de métricas.

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](./LICENSE) para mais informações.

---
Desenvolvido por **Nexo** 🎫
