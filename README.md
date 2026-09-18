# Chatbot com Integrações

[![CI](https://github.com/CaueFAbreu/chatbot-integrations/actions/workflows/ci.yml/badge.svg)](https://github.com/CaueFAbreu/chatbot-integrations/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Chatbot no Telegram construído em arquitetura de microsserviços, com um motor
de conversação (`chat-engine`) e dois serviços de integração isolados: um
para respostas geradas por LLM e outro para consumir a API REST do GitHub.

**Demo ao vivo:** mande uma mensagem pro [@caue_chatbot_dev_bot](https://t.me/caue_chatbot_dev_bot) no Telegram.

---

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Stack técnica](#stack-técnica)
- [Como rodar](#como-rodar)
- [Rodando os testes](#rodando-os-testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Roadmap](#roadmap)
- [Licença](#licença)

## Visão geral

Este projeto demonstra um chatbot com arquitetura de produção, construído em
Node.js e TypeScript, implantado como três serviços independentes que se
comunicam via REST. Foi construído pra reunir, num único projeto funcional,
as competências centrais de uma vaga de desenvolvedor de chatbot/Node.js:
construção de fluxos de conversação, integração com APIs de terceiros,
microsserviços, testes automatizados e código limpo em camadas.

**Funcionalidades principais:**
- Responde perguntas livres via LLM ([Groq](https://groq.com))
- Lista issues abertas de um repositório do GitHub sob demanda
- Persiste o histórico de conversa por chat (MySQL via Prisma)
- Roda totalmente containerizado (Docker Compose) e implantado na [Railway](https://railway.com)

## Arquitetura

```
                     ┌───────────────────┐
   Telegram  ───────▶│    chat-engine     │
                     │ (motor de fluxo,   │
                     │  contexto da conv.)│
                     └─────────┬──────────┘
                               │ HTTP / REST
                  ┌────────────┴────────────┐
                  ▼                         ▼
         ┌─────────────────┐       ┌───────────────────┐
         │   llm-service     │       │  github-service     │
         │  (API da Groq)     │       │ (issues, comentários) │
         └─────────────────┘       └───────────────────┘
```

- **`chat-engine`** — recebe mensagens via webhook do Telegram, persiste o
  histórico da conversa (Prisma + MySQL) e roteia cada mensagem pro handler
  de intenção certo, usando um **Strategy pattern** (`IntentRouter` +
  implementações independentes de `IntentHandler`).
- **`llm-service`** — isola toda a comunicação com o provedor de LLM. Trocar
  de provedor no futuro significa mexer só nesse serviço.
- **`github-service`** — isola toda a comunicação com a API REST do GitHub
  (listar issues abertas, comentar em issues).

Cada serviço é testável de forma independente, implantável de forma
independente, e possui uma única dependência externa — o que mantém o
`chat-engine` livre de qualquer conhecimento sobre como as APIs do LLM ou do
GitHub funcionam por dentro.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript (Node.js 20) |
| Framework HTTP | Express |
| Banco de dados / ORM | MySQL + Prisma |
| Testes | Jest |
| Containerização | Docker, Docker Compose |
| CI | GitHub Actions |
| Hospedagem | Railway |
| Provedor de LLM | Groq (modelos Llama / GPT-OSS) |
| Plataforma de mensagens | Telegram Bot API |

## Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Um [token de bot do Telegram](https://core.telegram.org/bots#botfather)
- Uma [chave de API gratuita da Groq](https://console.groq.com)
- Um [personal access token do GitHub](https://github.com/settings/tokens) com escopo `repo`

### Rodando localmente

```bash
# 1. Copiar os .env.example de cada serviço e preencher com suas credenciais
cp chat-engine/.env.example chat-engine/.env
cp integration-gateway/llm-service/.env.example integration-gateway/llm-service/.env
cp integration-gateway/github-service/.env.example integration-gateway/github-service/.env

# Crie também um .env na raiz do projeto (mesma pasta do docker-compose.yml)
# com TELEGRAM_BOT_TOKEN, GROQ_API_KEY, GITHUB_TOKEN, GITHUB_REPO

# 2. Subir tudo (MySQL + os 3 serviços)
docker compose up --build

# 3. Rodar as migrations do Prisma (com o container do chat-engine no ar)
docker compose exec chat-engine npx prisma migrate deploy

# 4. Configurar o webhook do Telegram apontando pra sua URL pública
#    (use ngrok ou similar em ambiente local)
curl "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=https://<SEU_DOMINIO>/webhook/telegram"
```

## Rodando os testes

```bash
cd chat-engine && npm install && npm test
cd integration-gateway/llm-service && npm install && npm test
cd integration-gateway/github-service && npm install && npm test
```

Os três serviços têm cobertura via Jest, com testes unitários do roteador
de intenções e dos clients HTTP de cada API externa (usando mocks).

## Estrutura do projeto

```
chatbot-integrations/
├── chat-engine/                 # Motor de conversação + webhook do Telegram
│   ├── src/intents/              # IntentRouter + implementações de IntentHandler
│   ├── src/services/             # Persistência de conversa, clients HTTP
│   ├── src/telegram/             # Client da API do Telegram
│   └── prisma/                   # Schema e migrations do banco
├── integration-gateway/
│   ├── llm-service/              # Integração isolada com o provedor de LLM
│   └── github-service/           # Integração isolada com a API REST do GitHub
├── docker-compose.yml            # Orquestração local de todos os serviços + MySQL
└── .github/workflows/ci.yml      # CI: roda a suíte de testes dos 3 serviços
```

## Decisões de arquitetura

| Requisito | Onde está no projeto |
|---|---|
| Construção de fluxos de chatbot | `chat-engine/src/intents/` — `IntentRouter` + handlers (Strategy pattern) |
| Integração com APIs de terceiros | `llm-service` e `github-service`, cada um com um client HTTP isolado |
| Microsserviços | Três serviços independentes, orquestrados via `docker-compose.yml` |
| APIs REST | Cada serviço expõe e consome endpoints REST |
| Testes unitários | Jest em todos os serviços, cobrindo roteamento de intenção e clients HTTP (mocados) |
| Clean code | Estrutura em camadas (routes → intents → services/clients), interfaces explícitas |

## Roadmap

- [x] Deploy dos três serviços (Railway)
- [ ] Adicionar um handler de comentário automático em issues via chat
- [ ] Rate limiting no webhook do Telegram
- [ ] Logging estruturado

## Licença

Distribuído sob a [Licença MIT](./LICENSE).


