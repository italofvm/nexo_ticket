# Guia de Deploy - Render

Este documento descreve como realizar o deploy do bot NexoTicket na plataforma Render utilizando o arquivo de configuração `render.yaml`.

## Pré-requisitos

-   Conta no [Render](https://render.com/).
-   Repositório conectado à sua conta do Render.

## Configuração Automática (Blueprints)

O projeto inclui um arquivo `render.yaml` na raiz, que automatiza a criação do serviço.

1.  No dashboard do Render, clique em **New +** e selecione **Blueprint**.
2.  Conecte este repositório.
3.  O Render detectará automaticamente o arquivo `render.yaml` e exibirá o serviço `nexo-bot`.
4.  Clique em **Apply** para criar o serviço.

## Variáveis de Ambiente

Por questões de segurança, tokens e segredos não são commitados no `render.yaml`. Você deve configurá-los manualmente no dashboard do Render após a criação do serviço, ou durante a configuração inicial se solicitado.

Acesse a aba **Environment** do serviço `nexo-bot` e adicione:

| Chave | Descrição |
| :--- | :--- |
| `DISCORD_TOKEN` | Token do seu bot Discord. |
| `DATABASE_URL` | URL de conexão com o banco de dados (PostgreSQL/NeonDB). |

> **Nota:** A variável `NODE_VERSION` já está configurada como `20.x` no `render.yaml`.

## Verificação

Após o deploy:
1.  Verifique os **Logs** no dashboard do Render para confirmar se o bot iniciou corretamente.
2.  O comando de start executará as migrações do banco de dados automaticamente antes de iniciar o bot.
