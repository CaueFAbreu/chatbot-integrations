# Chatbot com Integrações

Chatbot no Telegram construído em arquitetura de microsserviços, com um motor de
conversação (`chat-engine`) e dois serviços de integração isolados: um para
respostas geradas por LLM e outro para consumir a API REST do GitHub.

## Arquitetura

```
                     ┌──────────────────┐
   Telegram  ───────▶│    chat-engine    │
                     │ (motor de fluxo,  │
                     │  contexto no DB)  │
                     └────────┬──────────┘
                              │ HTTP
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌────────────────┐        ┌──────────────────┐
        │   llm-service    │        │  github-service    │
        │ (OpenAI/Claude)  │        │ (issues, comments)  │
        └────────────────┘        └──────────────────┘
```

- **chat-engine**: recebe as mensagens via webhook do Telegram, guarda o
  histórico da conversa (Prisma + MySQL) e decide qual intenção tratar a
  mensagem, usando um roteador baseado em **Strategy pattern** — cada
  intenção é um `IntentHandler` independente.
- **llm-service**: microsserviço que isola a chamada à API de LLM. Trocar de
  provedor de IA no futuro significa mexer só aqui.
- **github-service**: microsserviço que isola o consumo da API REST do
  GitHub (lista issues abertas, comenta em issues).

## Por que essa arquitetura

Separar cada integração em seu próprio serviço, comunicando-se por HTTP/REST,
é a forma mais direta de demonstrar na prática os requisitos de uma vaga
de chatbot/Node.js:

| Requisito da vaga | Onde está no projeto |
|---|---|
| Construção de fluxos de chatbot | `chat-engine/src/intents/` — `IntentRouter` + handlers |
| Integração com APIs | `llm-service` e `github-service`, cada um com um client isolado |
| Microsserviços | Três serviços independentes, orquestrados via `docker-compose.yml` |
| APIs REST | Cada serviço expõe e consome endpoints REST |
| Testes unitários | Jest em cada serviço, cobrindo roteamento de intenção e clients HTTP (com mocks) |
| Clean code | Camadas separadas (routes → intents → services/clients), interfaces explícitas |

## Rodando localmente

```bash
# 1. Copiar os .env.example de cada serviço e preencher as variáveis
cp chat-engine/.env.example chat-engine/.env
cp integration-gateway/llm-service/.env.example integration-gateway/llm-service/.env
cp integration-gateway/github-service/.env.example integration-gateway/github-service/.env

# 2. Subir tudo (MySQL + os 3 serviços)
docker compose up --build

# 3. Rodar as migrations do Prisma (com o container do chat-engine no ar)
docker compose exec chat-engine npx prisma migrate deploy

# 4. Configurar o webhook do Telegram apontando pra sua URL pública
#    (use ngrok ou similar em ambiente local)
curl "https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=https://SEU_DOMINIO/webhook/telegram"
```

## Rodando os testes

```bash
cd chat-engine && npm install && npm test
cd integration-gateway/llm-service && npm install && npm test
cd integration-gateway/github-service && npm install && npm test
```

## Próximos passos

- [ ] Deploy dos três serviços (Railway/Render/Fly.io)
- [ ] Adicionar um handler de comentário automático em issues via chat
- [ ] Rate limiting no webhook do Telegram
