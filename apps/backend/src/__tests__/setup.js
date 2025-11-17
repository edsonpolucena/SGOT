// Configuração de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
// NÃO mudar DATABASE_URL - usar o mesmo banco
process.env.EMAIL_FROM = 'test@example.com';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.COMPANY_DEFAULT_ID = '';

// Desabilitar logs durante testes
process.env.SILENT = 'true';

console.log('📝 AVISO: Os testes NÃO vão limpar dados do banco de desenvolvimento automaticamente.');
console.log('   Os testes criam dados temporários que permanecerão no banco.');
console.log('   Use npx prisma db seed para restaurar dados padrão após os testes.\n');
