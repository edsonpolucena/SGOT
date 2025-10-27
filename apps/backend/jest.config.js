module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  // Limpar mocks automaticamente
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Configurar variáveis de ambiente para testes
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  // Configuração de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!src/server.js',
    '!src/config/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 70,
      lines: 65,
      statements: 65
    }
  }
};
