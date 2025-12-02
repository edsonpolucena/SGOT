const Sentry = require('@sentry/node');

const SENTRY_DSN = process.env.SENTRY_DSN;
let isInitialized = false;

if (SENTRY_DSN && SENTRY_DSN.trim() !== '' && process.env.NODE_ENV !== 'test') {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) 
        : 0.1,
      beforeSend(event, hint) {
        if (process.env.SENTRY_FILTER_SENSITIVE_DATA === 'true') {
          if (event.request) {
            if (event.request.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
            }
            if (event.request.data) {
              if (typeof event.request.data === 'object') {
                delete event.request.data.password;
                delete event.request.data.passwordHash;
              }
            }
          }
        }
        return event;
      },
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      Sentry.captureException(reason, {
        tags: {
          type: 'unhandledRejection',
        },
      });
      console.error('Unhandled Rejection:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      Sentry.captureException(error, {
        tags: {
          type: 'uncaughtException',
        },
      });
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    isInitialized = true;
    console.log('🔍 Sentry ativado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Sentry:', error.message);
    console.error('   Stack:', error.stack);
  }
} else {
  if (!SENTRY_DSN || SENTRY_DSN.trim() === '') {
    console.log('⚠️ Sentry não configurado (SENTRY_DSN não definido ou vazio)');
  } else if (process.env.NODE_ENV === 'test') {
    console.log('⚠️ Sentry desabilitado (modo de teste)');
  }
}

module.exports = isInitialized ? Sentry : null;

