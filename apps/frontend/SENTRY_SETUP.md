# Configuração do Sentry - Frontend

## Instalação

O Sentry já está instalado como dependência (`@sentry/react`).

## Configuração

1. Crie uma conta no [Sentry](https://sentry.io) (ou use uma existente)
2. Crie um novo projeto do tipo "React"
3. Copie o DSN fornecido pelo Sentry
4. Adicione as seguintes variáveis no seu arquivo `.env` ou `.env.local`:

```env
VITE_SENTRY_DSN="https://seu-dsn@sentry.io/projeto-id"
VITE_SENTRY_TRACES_SAMPLE_RATE="0.1"
VITE_SENTRY_FILTER_SENSITIVE_DATA="true"
```

## Variáveis de Ambiente

- `VITE_SENTRY_DSN`: DSN do projeto Sentry (obrigatório para ativar)
- `VITE_SENTRY_TRACES_SAMPLE_RATE`: Taxa de amostragem para performance (0.0 a 1.0, padrão: 0.1 = 10%)
- `VITE_SENTRY_FILTER_SENSITIVE_DATA`: Se "true", remove dados sensíveis antes de enviar (padrão: "true")

## Funcionalidades

- ✅ Error Boundary para erros React
- ✅ Captura de erros de API (status >= 500)
- ✅ Captura de erros de rede
- ✅ Session Replay (gravação de sessões em caso de erro)
- ✅ Performance monitoring (browser tracing)
- ✅ Filtro de dados sensíveis (passwords, tokens)
- ✅ Contexto do usuário

## Error Boundary

O aplicativo está envolvido por um Error Boundary do Sentry que:
- Captura erros não tratados em componentes React
- Exibe uma tela de erro amigável
- Permite ao usuário tentar novamente
- Mostra detalhes do erro em modo de desenvolvimento

## Interceptor HTTP

O interceptor HTTP captura automaticamente:
- Erros de servidor (status >= 500)
- Erros de rede (sem resposta)
- Adiciona contexto (endpoint, method, statusCode)

## Desativar Sentry

Para desativar o Sentry, simplesmente não defina a variável `VITE_SENTRY_DSN` ou remova-a do `.env`.

## Testes

O Sentry é automaticamente desativado quando `MODE=test` para não interferir nos testes.

