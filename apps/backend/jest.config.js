module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  // Limpar mocks automaticamente
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Configurar variáveis de ambiente para testes
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  // Especificar o que é considerado um teste
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
    '**/*.int.test.js'
  ],
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
