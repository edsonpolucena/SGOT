#!/usr/bin/env node

/**
 * Script para mostrar quais pastas/arquivos estão sendo validados nos testes
 */

const config = require('./jest.config.js');
const fs = require('fs');
const path = require('path');

console.log('\n📊 CONFIGURAÇÃO DE COBERTURA DO BACKEND\n');
console.log('═'.repeat(60));

console.log('\n✅ PASTAS/ARQUIVOS INCLUÍDOS (collectCoverageFrom):\n');
config.collectCoverageFrom.forEach(pattern => {
  const isExcluded = pattern.startsWith('!');
  const icon = isExcluded ? '  ✗' : '  ✓';
  const cleanPattern = isExcluded ? pattern.substring(1) : pattern;
  console.log(`${icon} ${cleanPattern}`);
});

console.log('\n❌ PASTAS IGNORADAS (coveragePathIgnorePatterns):\n');
config.coveragePathIgnorePatterns.forEach(pattern => {
  console.log(`  ✗ ${pattern}`);
});

console.log('\n📁 ESTRUTURA DE PASTAS EM src/:\n');
function listDir(dir, prefix = '') {
  const items = fs.readdirSync(dir).filter(item => 
    !item.startsWith('.') && item !== 'node_modules'
  );
  
  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const currentPrefix = isLast ? '└── ' : '├── ';
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    console.log(`${prefix}${currentPrefix}${item}`);
    
    if (stats.isDirectory() && !item.includes('__tests__')) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      try {
        listDir(itemPath, nextPrefix);
      } catch (e) {
        // Ignora erros de permissão
      }
    }
  });
}

try {
  listDir(path.join(__dirname, 'src'));
} catch (e) {
  console.log('  (erro ao listar diretório)');
}

console.log('\n💡 ONDE OS TESTES ESTÃO:\n');
console.log('  📂 src/__tests__/ - Todos os arquivos de teste');
console.log('  📝 Padrão: **/*.test.js, **/*.int.test.js\n');

console.log('═'.repeat(60));
console.log('\n');

