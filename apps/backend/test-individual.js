const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testFile = process.argv[2];

if (!testFile) {
  console.error('Usage: node test-individual.js <test-file>');
  process.exit(1);
}

console.log(`\n🧪 Executando: ${testFile}\n`);
console.log('='.repeat(80));

try {
  const output = execSync(`npm test -- ${testFile}`, {
    encoding: 'utf8',
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  console.log(output);
  console.log('\n✅ Teste passou!\n');
  process.exit(0);
} catch (error) {
  const stdout = error.stdout || '';
  const stderr = error.stderr || '';
  
  console.log(stdout);
  if (stderr) {
    console.error('\nSTDERR:', stderr);
  }
  
  console.log('\n❌ Teste falhou!\n');
  process.exit(1);
}

