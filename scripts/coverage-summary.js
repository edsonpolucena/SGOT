#!/usr/bin/env node

/**
 * Script para mostrar resumo de cobertura do backend e frontend
 * 
 * Uso: node scripts/coverage-summary.js
 */

const fs = require('fs');
const path = require('path');

function parseHTMLCoverage(htmlPath) {
  try {
    if (!fs.existsSync(htmlPath)) {
      return null;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Extrai porcentagens do HTML
    const statementsMatch = html.match(/<span class="strong">([\d.]+)%\s*<\/span>\s*<span class="quiet">Statements<\/span>\s*<span class='fraction'>(\d+)\/(\d+)/);
    const branchesMatch = html.match(/<span class="strong">([\d.]+)%\s*<\/span>\s*<span class="quiet">Branches<\/span>\s*<span class='fraction'>(\d+)\/(\d+)/);
    const functionsMatch = html.match(/<span class="strong">([\d.]+)%\s*<\/span>\s*<span class="quiet">Functions<\/span>\s*<span class='fraction'>(\d+)\/(\d+)/);
    const linesMatch = html.match(/<span class="strong">([\d.]+)%\s*<\/span>\s*<span class="quiet">Lines<\/span>\s*<span class='fraction'>(\d+)\/(\d+)/);

    if (!statementsMatch || !branchesMatch || !functionsMatch || !linesMatch) {
      return null;
    }

    return {
      statements: {
        percentage: statementsMatch[1],
        covered: parseInt(statementsMatch[2]),
        total: parseInt(statementsMatch[3]),
      },
      branches: {
        percentage: branchesMatch[1],
        covered: parseInt(branchesMatch[2]),
        total: parseInt(branchesMatch[3]),
      },
      functions: {
        percentage: functionsMatch[1],
        covered: parseInt(functionsMatch[2]),
        total: parseInt(functionsMatch[3]),
      },
      lines: {
        percentage: linesMatch[1],
        covered: parseInt(linesMatch[2]),
        total: parseInt(linesMatch[3]),
      },
    };
  } catch (error) {
    return null;
  }
}

function calculateCoverageFromJSON(coverageData) {
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalStatements = 0;
  let coveredStatements = 0;

  Object.values(coverageData).forEach((file) => {
    // Statements (s) - pode ser array ou objeto
    if (file.s) {
      const statements = Array.isArray(file.s) ? file.s : Object.values(file.s);
      totalStatements += statements.length;
      coveredStatements += statements.filter((count) => count > 0).length;
    }

    // Lines - calculado a partir dos statements
    if (file.statementMap) {
      const lineMap = {};
      Object.keys(file.statementMap).forEach((key) => {
        const stmt = file.statementMap[key];
        const line = stmt.start.line;
        if (!lineMap[line]) {
          lineMap[line] = false;
        }
        // Verifica se a linha está coberta
        const count = Array.isArray(file.s) ? file.s[parseInt(key)] : file.s[key];
        if (count > 0) {
          lineMap[line] = true;
        }
      });
      totalLines += Object.keys(lineMap).length;
      coveredLines += Object.values(lineMap).filter((covered) => covered).length;
    } else if (file.s) {
      // Fallback: se não tem statementMap, usa statements como linhas
      const statements = Array.isArray(file.s) ? file.s : Object.values(file.s);
      totalLines += statements.length;
      coveredLines += statements.filter((count) => count > 0).length;
    }

    // Functions (f) - pode ser array ou objeto
    if (file.f) {
      const functions = Array.isArray(file.f) ? file.f : Object.values(file.f);
      totalFunctions += functions.length;
      coveredFunctions += functions.filter((count) => count > 0).length;
    }

    // Branches (b) - pode ser array ou objeto
    if (file.b) {
      const branches = Array.isArray(file.b) ? file.b : Object.values(file.b);
      totalBranches += branches.length;
      coveredBranches += branches.filter((count) => count > 0).length;
    }
  });

  return {
    lines: {
      total: totalLines,
      covered: coveredLines,
      percentage: totalLines > 0 ? ((coveredLines / totalLines) * 100).toFixed(2) : '0.00',
    },
    functions: {
      total: totalFunctions,
      covered: coveredFunctions,
      percentage: totalFunctions > 0 ? ((coveredFunctions / totalFunctions) * 100).toFixed(2) : '0.00',
    },
    branches: {
      total: totalBranches,
      covered: coveredBranches,
      percentage: totalBranches > 0 ? ((coveredBranches / totalBranches) * 100).toFixed(2) : '0.00',
    },
    statements: {
      total: totalStatements,
      covered: coveredStatements,
      percentage: totalStatements > 0 ? ((coveredStatements / totalStatements) * 100).toFixed(2) : '0.00',
    },
  };
}

function readCoverageFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function main() {
  const backendHTMLPath = path.join(__dirname, '../apps/backend/coverage/index.html');
  const backendJSONPath = path.join(__dirname, '../apps/backend/coverage/coverage-final.json');
  const frontendHTMLPath = path.join(__dirname, '../apps/frontend/coverage/index.html');
  const frontendJSONPath = path.join(__dirname, '../apps/frontend/coverage/coverage-final.json');

  // Tenta ler do HTML primeiro (mais confiável), depois do JSON
  let backendCoverage = parseHTMLCoverage(backendHTMLPath);
  if (!backendCoverage) {
    const backendJSON = readCoverageFile(backendJSONPath);
    if (backendJSON) {
      backendCoverage = calculateCoverageFromJSON(backendJSON);
    }
  }

  let frontendCoverage = parseHTMLCoverage(frontendHTMLPath);
  if (!frontendCoverage) {
    const frontendJSON = readCoverageFile(frontendJSONPath);
    if (frontendJSON) {
      frontendCoverage = calculateCoverageFromJSON(frontendJSON);
    }
  }

  console.log('\n📊 COBERTURA DE CÓDIGO\n');
  console.log('═'.repeat(60));

  if (backendCoverage) {
    console.log('\n🔹 BACKEND');
    console.log(`   Linhas:      ${backendCoverage.lines.percentage}% (${backendCoverage.lines.covered}/${backendCoverage.lines.total})`);
    console.log(`   Funções:     ${backendCoverage.functions.percentage}% (${backendCoverage.functions.covered}/${backendCoverage.functions.total})`);
    console.log(`   Branches:    ${backendCoverage.branches.percentage}% (${backendCoverage.branches.covered}/${backendCoverage.branches.total})`);
    console.log(`   Statements:  ${backendCoverage.statements.percentage}% (${backendCoverage.statements.covered}/${backendCoverage.statements.total})`);
  } else {
    console.log('\n🔹 BACKEND: ❌ Relatório não encontrado');
    console.log('   Execute: cd apps/backend && npm run test:ci');
  }

  if (frontendCoverage) {
    console.log('\n🔹 FRONTEND');
    console.log(`   Linhas:      ${frontendCoverage.lines.percentage}% (${frontendCoverage.lines.covered}/${frontendCoverage.lines.total})`);
    console.log(`   Funções:     ${frontendCoverage.functions.percentage}% (${frontendCoverage.functions.covered}/${frontendCoverage.functions.total})`);
    console.log(`   Branches:    ${frontendCoverage.branches.percentage}% (${frontendCoverage.branches.covered}/${frontendCoverage.branches.total})`);
    console.log(`   Statements:  ${frontendCoverage.statements.percentage}% (${frontendCoverage.statements.covered}/${frontendCoverage.statements.total})`);
  } else {
    console.log('\n🔹 FRONTEND: ❌ Relatório não encontrado');
    console.log('   Execute: cd apps/frontend && npm run test:ci');
  }

  if (backendCoverage && frontendCoverage) {
    const totalLines = backendCoverage.lines.total + frontendCoverage.lines.total;
    const totalCovered = backendCoverage.lines.covered + frontendCoverage.lines.covered;
    const totalPercentage = totalLines > 0 ? ((totalCovered / totalLines) * 100).toFixed(2) : '0.00';

    console.log('\n' + '═'.repeat(60));
    console.log(`\n📈 TOTAL: ${totalPercentage}% (${totalCovered}/${totalLines} linhas)`);
  }

  console.log('\n💡 Dica: Use "npm run coverage:open:backend" ou "npm run coverage:open:frontend"');
  console.log('   para abrir os relatórios HTML detalhados.\n');
}

main();
