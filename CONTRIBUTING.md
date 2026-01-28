# Contribuindo para o NexoTicket 🎫

Agradecemos o seu interesse em contribuir para o NexoTicket! Este documento contém as diretrizes para ajudar no desenvolvimento do projeto.

## Como Contribuir

1. **Relatando Bugs:** Abra uma issue detalhando o problema, passos para reproduzir e logs se possível.
2. **Propondo Features:** Abra uma issue para discutir a nova funcionalidade antes de implementar.
3. **Pull Requests:**
    - Crie uma branch para sua modificação: `feat/minha-feature` ou `fix/problema-x`.
    - Siga o padrão de código estabelecido (ESLint).
    - Certifique-se de que as migrações de banco de dados (se houver) estão incluídas em `src/database/migrate.js`.
    - Documente as mudanças no README se necessário.

## Padrões de Código

- Usamos **ESLint** para garantir a consistência. Rode `npm run lint` antes de submeter.
- Variáveis e funções devem seguir `camelCase`.
- Commits devem ser claros e seguir a convenção de [Conventional Commits](https://www.conventionalcommits.org/).

## Ambiente de Desenvolvimento

1. Clone o repositório.
2. Instale as dependências com `npm install`.
3. Configure o `.env` baseado no `.env.example`.
4. Use `npm run dev` para rodar com hot-reload.

---
Feito com ❤️ pela equipe Nexo.
