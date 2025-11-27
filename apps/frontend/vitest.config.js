import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // Plugin React necessário para transformar JSX
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'], // Setup file para configurações globais
    // Padrão para encontrar testes: __tests__ dentro dos módulos ou arquivos .test.js
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      // garante a criação de coverage/lcov.info para o passo do GitHub Action
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'], // lcov gera lcov.info, lcovonly não
      // Incluir todos os arquivos que podem ser testados
      all: true, // true = instrumenta todos os arquivos incluídos
      include: [
        // Arquivos que são realmente testados
        'src/shared/lib/**/*.js',
        'src/shared/utils/**/*.js',
        'src/shared/services/**/*.js',  // ✅ Adicionado: http.js
        'src/shared/context/**/*.jsx',   // ✅ Adicionado: AuthContext.jsx
        'src/shared/hooks/**/*.js',
        'src/shared/ui/**/*.jsx',
        'src/routes/**/*.{js,jsx}',      // ✅ Inclui .js também (index.js)
        'src/shared/icons/**/*.js',
        // Módulos que têm testes
        'src/modules/analytics/**/*.{js,jsx}',
        'src/modules/audit/**/*.{js,jsx}',
        'src/modules/notifications/**/*.{js,jsx}',
        'src/modules/company/**/*.{js,jsx}',
        'src/modules/users/**/*.{js,jsx}',
        'src/modules/auth/**/*.{js,jsx}', // ✅ Adicionado: auth controller
        // Arquivos base
        'src/app/**/*.jsx'
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/styles/**',
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
        'src/test/**',
        // Excluir apenas views grandes que não são testadas
        'src/modules/**/view/**',
        'src/**/components/**'
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


