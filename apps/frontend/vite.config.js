import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Configuração de test removida - usa vitest.config.js em vez disso
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    // Otimizações para build mais rápido e leve
    minify: 'esbuild', // esbuild é mais rápido que terser
    target: 'es2015', // Target mais baixo = build mais rápido
    cssMinify: 'esbuild', // Minificação CSS mais rápida
    chunkSizeWarningLimit: 1000, // Aumenta limite de aviso de chunks grandes
    rollupOptions: {
      output: {
        manualChunks: undefined // Desabilita chunking manual para build mais rápido
      }
    },
    // Reduz verbosidade do build
    reportCompressedSize: false, // Não calcula tamanho comprimido (economiza tempo)
    sourcemap: false // Desabilita sourcemaps em produção (mais rápido)
  }
});
