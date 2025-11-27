const { execSync } = require('child_process');
const path = require('path');

const testFile = process.argv[2];

if (!testFile) {
  console.error('Usage: node run-test.js <test-file>');
  process.exit(1);
}

try {
  console.log(`\n🧪 Executando: ${testFile}\n`);
  const result = execSync(`npx vitest run "${testFile}"`, {
    encoding: 'utf8',
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('\n✅ Teste passou!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Teste falhou!\n');
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.error('STDERR:', error.stderr);
  process.exit(1);
}

