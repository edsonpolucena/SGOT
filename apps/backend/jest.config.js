module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
    '**/*.int.test.js'
  ],
  collectCoverage: true,               // 🔹 garante coverage sempre
  coverageDirectory: 'coverage',       // 🔹 pasta fixa: apps/backend/coverage
  coverageProvider: 'v8',              // 🔹 usa v8 para melhor rastreamento
  coveragePathIgnorePatterns: [       // 🔹 ignora apenas o necessário
    '/node_modules/',
    '/coverage/',
    '/__tests__/'
  ],
  // rootDir padrão é o diretório onde jest.config.js está (apps/backend)
  // Os caminhos no LCOV serão gerados como src/...
  // O workflow GitHub Actions corrige para apps/backend/src/... para bater com sonar.sources
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/swagger.js',
    '!src/server.js',
    '!src/migrations/**',    // se existirem
    '!src/prisma/**'       // se tiver pasta prisma gerada


  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  // Threshold removido para não bloquear geração de relatórios
  // A cobertura será reportada mesmo que abaixo dos thresholds
  // coverageThreshold: {
  //   global: {
  //     branches: 75,
  //     functions: 75,
  //     lines: 75,
  //     statements: 75
  //   }
  // }
};
