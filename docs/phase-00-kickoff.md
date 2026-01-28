# Fase 0 — Kickoff & Documentação Inicial

## 📝 Visão Geral do Projeto
**NexoTicket** é um sistema de tickets para Discord de alto desempenho, focado em escalabilidade e segurança. O projeto utiliza PostgreSQL (NeonDB) para persistência e Discord.js v14 para integração.

## 🎯 Objetivos
- Prover uma interface de tickets intuitiva via Slash Commands.
- Garantir segurança total contra SQL Injection e vazamento de dados.
- Logs detalhados para auditoria.
- Arquitetura plug-and-play para novos comandos e eventos.

## 👥 Stakeholders
- **Desenvolvedor:** Italo (Sênior)
- **Usuário Final:** Administradores de servidores Discord.

## 🛠️ Stack Tecnológica (MVP)
- **Backend:** Node.js v20+
- **Library:** Discord.js v14
- **Banco de Dados:** NeonDB (PostgreSQL)
- **Logger:** Winston
- **Hospedagem:** Railway

## 🚨 Riscos e Dependências
- **Dependência:** API do Discord (Uptime).
- **Risco:** Rate limiting se não configurado corretamente.
- **Risco:** Exposição de tokens se não usar `.env` corretamente.

## 📅 Roadmap Inicial
1. [x] Kickoff e Planejamento.
2. [ ] Setup de Infraestrutura (DB/Bot Token).
3. [ ] Implementação de Core (Handlers/Logger).
4. [ ] Implementação de Feature de Tickets.
5. [ ] Deploy em Staging (Railway).
