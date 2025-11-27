const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testFiles = [
  'src/__tests__/analytics.controller.test.js',
  'src/__tests__/analytics.service.test.js',
  'src/__tests__/audit.controller.test.js',
  'src/__tests__/audit.helper.test.js',
  'src/__tests__/audit.service.test.js',
  'src/__tests__/auth.controller.test.js',
  'src/__tests__/auth.int.test.js',
  'src/__tests__/auth.service.test.js',
  'src/__tests__/authorize.middleware.test.js',
  'src/__tests__/company-tax-profile.controller.test.js',
  'src/__tests__/company-tax-profile.service.test.js',
  'src/__tests__/company.controller.test.js',
  'src/__tests__/company.service.test.js',
  'src/__tests__/email.service.test.js',
  'src/__tests__/error.middleware.test.js',
  'src/__tests__/health.test.js',
  'src/__tests__/notification.controller.test.js',
  'src/__tests__/notification.cron.test.js',
  'src/__tests__/notification.service.test.js',
  'src/__tests__/obligation-file.service.test.js',
  'src/__tests__/obligation.controller.test.js',
  'src/__tests__/obligation.service.test.js',
  'src/__tests__/obligation.utils.test.js',
  'src/__tests__/obligations.int.test.js',
  'src/__tests__/password-reset.service.test.js',
  'src/__tests__/requireAuth.middleware.test.js',
  'src/__tests__/s3.service.test.js',
  'src/__tests__/tax-calendar.controller.test.js',
  'src/__tests__/tax-calendar.service.test.js',
  'src/__tests__/upload.middleware.test.js',
  'src/__tests__/users.controller.test.js',
  'src/__tests__/users.service.test.js',
  'src/__tests__/validation.middleware.test.js',
];

const results = {
  passed: [],
  failed: []
};

console.log('Executando testes do backend...\n');
console.log('='.repeat(80));

testFiles.forEach((testFile, index) => {
  console.log(`\n[${index + 1}/${testFiles.length}] ${testFile}`);
  console.log('-'.repeat(80));
  
  try {
    const output = execSync(`npm test -- ${testFile}`, {
      encoding: 'utf8',
      cwd: __dirname,
      stdio: 'pipe',
      timeout: 30000
    });
    
    // Verificar se passou (Jest mostra "PASS" ou número de testes passados)
    if (output.includes('PASS') || output.match(/\d+ passing/)) {
      console.log('✅ PASSOU');
      results.passed.push(testFile);
    } else {
      console.log('❌ FALHOU');
      console.log(output.substring(0, 500)); // Primeiras 500 chars
      results.failed.push(testFile);
    }
  } catch (error) {
    console.log('❌ FALHOU');
    const output = error.stdout || error.message;
    console.log(output.substring(0, 500));
    results.failed.push(testFile);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\nRESUMO:');
console.log(`✅ Passaram: ${results.passed.length}`);
console.log(`❌ Falharam: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\nTestes que falharam:');
  results.failed.forEach(f => console.log(`  - ${f}`));
}

// Salvar resultados
fs.writeFileSync(
  path.join(__dirname, 'test-results.json'),
  JSON.stringify(results, null, 2)
);

process.exit(results.failed.length > 0 ? 1 : 0);

