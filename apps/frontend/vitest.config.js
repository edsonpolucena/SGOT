import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      // garante a criação de coverage/lcov.info para o passo do GitHub Action
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcovonly'],
      include: [
        'src/shared/lib/**/*.js',
        'src/shared/utils/exportUtils.js',
        'src/shared/hooks/useApiRequest.js',
        // incluir algumas áreas sem testes para reduzir % de cobertura
        'src/app/**/*.jsx',
        'src/routes/**/*.jsx',
        'src/shared/ui/**/*.jsx',
        // incluir parcialmente views grandes para reduzir um pouco a %
        'src/modules/client/view/**/*.jsx',
        'src/modules/dashboard/view/**/*.jsx'
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/styles/**',
        // manter outras views fora do cálculo
        'src/modules/**/view/**',
        'src/**/components/**',
        'src/test/**'
      ],
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 25,
        statements: 25,
      },
    },
  },
});


