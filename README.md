# Chatbot Integrations

> Chatbot para Telegram construído em arquitetura de microsserviços, com integrações plugáveis de LLM e GitHub — desenvolvido para demonstrar arquitetura limpa, isolamento de serviços e práticas de CI/CD.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/Licença-MIT-yellow.svg)](#licença)

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Por Que Essa Arquitetura](#por-que-essa-arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Começar](#como-começar)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação](#instalação)
  - [Rodando Localmente](#rodando-localmente)
- [Testes](#testes)
- [Roadmap](#roadmap)
- [Autor](#autor)
- [Licença](#licença)

---

## Visão Geral

**Chatbot Integrations** é um chatbot para Telegram construído sobre uma arquitetura de microsserviços. Em vez de um bot monolítico, o motor de conversação é desacoplado das integrações externas, cada uma vivendo em seu próprio serviço, implantável de forma independente:

- **`chat-engine`** — recebe eventos via webhook do Telegram, gerencia o estado e o histórico da conversa, e roteia mensagens para o handler adequado.
- **`llm-service`** — isola toda a comunicação com provedores de LLM (OpenAI / Claude), de modo que trocar de provedor exige alterações em um único lugar.
- **`github-service`** — isola o consumo da API REST do GitHub (listagem de issues, criação de comentários).

Essa separação de responsabilidades reflete sistemas reais de produção e foi pensada para evidenciar habilidades práticas de arquitetura back-end, integração de APIs e implantação em containers.

## Arquitetura

```
                  ┌───────────────────┐
Telegram  ───────▶│    chat-engine     │
                  │ (fluxo de conversa,│
                  │  estado no banco)  │
                  └─────────┬──────────┘
                            │ HTTP
               ┌────────────┴────────────┐
               ▼                         ▼
      ┌───────────────────┐   ┌────────────────────┐
      │    llm-service      │   │   github-service     │
      │ (OpenAI / Claude)    │   │ (issues, comentários) │
      └───────────────────┘   └────────────────────┘
```

Cada intenção é tratada por um `IntentHandler` independente, roteado por um `IntentRouter` construído com o **padrão Strategy** — novas funcionalidades podem ser adicionadas sem alterar o fluxo central de tratamento de mensagens.

## Por Que Essa Arquitetura

| Requisito                        | Onde está demonstrado                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Fluxos de conversação de chatbot  | `chat-engine/src/intents/` — `IntentRouter` + handlers                                |
| Integração com APIs de terceiros  | `llm-service` e `github-service`, cada um com um client isolado                        |
| Microsserviços                    | Três serviços independentes, orquestrados via `docker-compose.yml`                     |
| APIs RESTful                      | Cada serviço expõe e consome endpoints REST                                            |
| Testes unitários                  | Jest em cada serviço, cobrindo roteamento de intenções e clients HTTP (com mocks)       |
| Clean code                        | Camadas bem definidas (routes → intents → services/clients), interfaces explícitas     |

## Stack Tecnológica

- **Runtime:** Node.js
- **Persistência:** Prisma ORM + MySQL
- **Mensageria:** Telegram Bot API (webhooks)
- **Integração com IA:** APIs OpenAI / Claude
- **Containerização:** Docker & Docker Compose
- **Testes:** Jest
- **CI/CD:** GitHub Actions

## Estrutura do Projeto

```
chatbot-integrations/
├── chat-engine/            # Motor de conversação (webhook, estado, roteamento de intenções)
├── integration-gateway/
│   ├── llm-service/        # Integração com provedor de LLM
│   └── github-service/     # Integração com a API REST do GitHub
├── .github/workflows/      # Pipelines de CI/CD
└── docker-compose.yml      # Orquestração dos múltiplos serviços
```

## Como Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) & Docker Compose
- Um token de bot do Telegram ([BotFather](https://t.me/BotFather))
- Acesso a uma API de provedor de LLM (OpenAI ou Claude)
- (Para testes locais de webhook) uma ferramenta de túnel, como o [ngrok](https://ngrok.com/)

### Instalação

```bash
git clone https://github.com/CaueFAbreu/chatbot-integrations.git
cd chatbot-integrations

# Copie e preencha as variáveis de ambiente de cada serviço
cp chat-engine/.env.example chat-engine/.env
cp integration-gateway/llm-service/.env.example integration-gateway/llm-service/.env
cp integration-gateway/github-service/.env.example integration-gateway/github-service/.env
```

### Rodando Localmente

```bash
# Constrói e sobe o MySQL + os três serviços
docker compose up --build

# Aplica as migrations do Prisma (com o container do chat-engine no ar)
docker compose exec chat-engine npx prisma migrate deploy

# Configura o webhook do Telegram apontando para sua URL pública
curl "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=https://SEU_DOMINIO/webhook/telegram"
```

## Testes

Execute a suíte de testes de cada serviço de forma independente:

```bash
cd chat-engine && npm install && npm test
cd integration-gateway/llm-service && npm install && npm test
cd integration-gateway/github-service && npm install && npm test
```

## Roadmap

- [ ] Deploy dos três serviços (Railway / Render / Fly.io)
- [ ] Adicionar um handler de comentário automático em issues via chat
- [ ] Implementar rate limiting no webhook do Telegram

## Autor

**Cauê F. Abreu**
[GitHub](https://github.com/CaueFAbreu)

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
