const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Executando testes do backend...\n');

try {
  const output = execSync('npm test', {
    encoding: 'utf8',
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  // Salvar saída em arquivo
  fs.writeFileSync(path.join(__dirname, 'test-output.txt'), output);
  console.log(output);
  console.log('\n✅ Todos os testes passaram!');
} catch (error) {
  const output = error.stdout || error.message;
  fs.writeFileSync(path.join(__dirname, 'test-output.txt'), output);
  console.log(output);
  if (error.stderr) {
    console.error('\nSTDERR:', error.stderr);
  }
  process.exit(1);
}

