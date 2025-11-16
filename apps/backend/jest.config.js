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
  collectCoverageFrom: [
    // Arquivos base
    'src/app.js',
    'src/prisma.js',
    'src/swagger.js',
    // Middlewares
    'src/middleware/authorize.js',
    'src/middleware/error.js',
    'src/middleware/requireAuth.js',
    'src/middleware/validation.js',
    'src/middleware/upload.js',
    // Services
    'src/services/s3.service.js',
    'src/services/email.service.js',
    // Utils
    'src/utils/**/*.js',
    // Módulos completos
    'src/modules/analytics/**/*.js',
    'src/modules/audit/**/*.js',
    'src/modules/auth/**/*.js',
    'src/modules/company/**/*.js',
    'src/modules/notifications/**/*.js',
    'src/modules/obligations/**/*.js',
    'src/modules/tax-calendar/**/*.js',
    'src/modules/users/**/*.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  }
};
