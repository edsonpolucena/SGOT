# Configuração do Sentry - Backend

## Instalação

O Sentry já está instalado como dependência (`@sentry/node`).

## Configuração

1. Crie uma conta no [Sentry](https://sentry.io) (ou use uma existente)
2. Crie um novo projeto do tipo "Node.js"
3. Copie o DSN fornecido pelo Sentry
4. Adicione as seguintes variáveis no seu arquivo `.env`:

```env
SENTRY_DSN="https://seu-dsn@sentry.io/projeto-id"
SENTRY_TRACES_SAMPLE_RATE="0.1"
SENTRY_FILTER_SENSITIVE_DATA="true"
```

## Variáveis de Ambiente

- `SENTRY_DSN`: DSN do projeto Sentry (obrigatório para ativar)
- `SENTRY_TRACES_SAMPLE_RATE`: Taxa de amostragem para performance (0.0 a 1.0, padrão: 0.1 = 10%)
- `SENTRY_FILTER_SENSITIVE_DATA`: Se "true", remove dados sensíveis antes de enviar (padrão: "true")

## Funcionalidades

- ✅ Captura de erros em middleware de erro
- ✅ Captura de unhandled rejections
- ✅ Captura de uncaught exceptions
- ✅ Contexto do usuário (ID, email)
- ✅ Tags (endpoint, method, statusCode)
- ✅ Filtro de dados sensíveis (passwords, tokens)
- ✅ Performance monitoring (traces)

## Desativar Sentry

Para desativar o Sentry, simplesmente não defina a variável `SENTRY_DSN` ou remova-a do `.env`.

## Testes

O Sentry é automaticamente desativado quando `NODE_ENV=test` para não interferir nos testes.

