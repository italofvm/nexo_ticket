# Fase 1 — Arquitetura & Design do Sistema

## 🏗️ Padrão Arquitetural
Seguiremos o padrão **Layered Architecture** simplificado, adaptado para bots de Discord:
- **Core:** Gerenciamento do ciclo de vida do bot, handlers de eventos e comandos.
- **Infrastructure:** Conexão com banco de dados e drivers de log.
- **Domain:** Lógica de negócio dos tickets (em fases futuras).

## 📁 Estrutura de Pastas
```text
/
├── .env                  # Variáveis sensíveis
├── .gitignore            # Exclusões do Git
├── package.json          # Manifesto do projeto
├── README.md             # Guia do projeto
├── src/
│   ├── index.js          # Entrada principal
│   ├── config/           # Validadores e constantes
│   ├── database/         # Schemas e queries PostgreSQL
│   ├── commands/         # Slash commands por categoria
│   ├── events/           # Listeners de eventos Discord
│   ├── utils/            # Helpers (Logger, Handlers, etc.)
│   └── services/         # Lógica de negócio complexa (opcional)
└── logs/                 # Arquivos de log (Winston)
```

## 🔐 Estratégia de Segurança
1. **Prepared Statements:** Obrigatório para todas as queries via SQL tags ou placeholders do `@neondatabase/serverless`.
2. **Environment Validation:** O processo falha imediatamente se o `DISCORD_TOKEN` ou `DATABASE_URL` for inválido ou ausente.
3. **Error Masking:** Erros de banco de dados registrados localmente no Logger, mas respondidos ao usuário com mensagens genéricas ("Ocorreu um erro interno").
4. **Rate Limiting:** Implementação de cooldowns nos comandos slash.
