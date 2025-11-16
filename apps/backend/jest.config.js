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
    // focar apenas nos módulos mais críticos e já bem testados
    'src/app.js',
    'src/prisma.js',
    'src/swagger.js',
    'src/middleware/authorize.js',
    'src/middleware/error.js',
    'src/middleware/requireAuth.js',
    'src/middleware/validation.js',
    'src/services/s3.service.js',
    'src/utils/**/*.js'
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
