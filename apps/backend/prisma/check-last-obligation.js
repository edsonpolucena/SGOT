const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
  console.log('🔍 Verificando última obrigação criada\n');

  const lastObligation = await prisma.obligation.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { 
      company: true, 
      files: true,
      user: true
    }
  });

  if (!lastObligation) {
    console.log('❌ Nenhuma obrigação encontrada no banco!\n');
    console.log('Você criou alguma obrigação?');
    return;
  }

  console.log('📄 ÚLTIMA OBRIGAÇÃO CRIADA:\n');
  console.log(`   ID: ${lastObligation.id}`);
  console.log(`   Empresa: ${lastObligation.company.codigo} - ${lastObligation.company.nome}`);
  console.log(`   taxType: ${lastObligation.taxType || '❌ NULL'}`);
  console.log(`   referenceMonth: ${lastObligation.referenceMonth || '❌ NULL'}`);
  console.log(`   Vencimento: ${new Date(lastObligation.dueDate).toLocaleDateString('pt-BR')}`);
  console.log(`   Valor: ${lastObligation.amount ? 'R$ ' + Number(lastObligation.amount).toFixed(2) : '❌ NULL'}`);
  console.log(`   Status: ${lastObligation.status}`);
  console.log(`   Arquivos: ${lastObligation.files.length}`);
  console.log(`   Criado por: ${lastObligation.user.name} (${lastObligation.user.email})`);
  console.log(`   Criado em: ${new Date(lastObligation.createdAt).toLocaleString('pt-BR')}`);

  console.log('\n📊 VALIDAÇÃO:\n');

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const hasFields = lastObligation.taxType && lastObligation.referenceMonth;
  const isCurrentMonth = lastObligation.referenceMonth === currentMonth;
  const isPosted = lastObligation.status === 'SUBMITTED' || 
                   lastObligation.status === 'PAID' || 
                   lastObligation.files.length > 0 ||
                   (lastObligation.amount && Number(lastObligation.amount) > 0);

  console.log(`   ✓ Tem taxType e referenceMonth? ${hasFields ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   ✓ É do mês atual (${currentMonth})? ${isCurrentMonth ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   ✓ Seria contada como postada? ${isPosted ? '✅ SIM' : '❌ NÃO'}`);

  if (!hasFields) {
    console.log('\n❌ PROBLEMA: Obrigação sem taxType ou referenceMonth!');
    console.log('   O frontend não enviou esses campos.');
    console.log('   Solução: Limpar cache do navegador completamente.');
  }

  if (!isCurrentMonth) {
    console.log('\n⚠️  ATENÇÃO: Obrigação não é do mês atual!');
    console.log(`   Esperado: ${currentMonth}`);
    console.log(`   Recebido: ${lastObligation.referenceMonth}`);
    console.log('   O dashboard só mostra obrigações do mês atual.');
  }

  if (hasFields && isCurrentMonth && isPosted) {
    console.log('\n✅ OBRIGAÇÃO VÁLIDA! Deveria aparecer no dashboard.');
    console.log('\nPróximo passo: Verificar se o endpoint do dashboard está sendo chamado.');
  }
}

check()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


