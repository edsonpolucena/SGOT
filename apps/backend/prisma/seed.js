const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  // Primeiro, limpar dados existentes para evitar conflitos
  // await prisma.obligation.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.empresa.deleteMany({});

  const passwordHash = await bcrypt.hash('secret123', 10);

  // Criar empresas primeiro (EMP001 = Contabilidade)
  const empresa1 = await prisma.empresa.upsert({
    where: { cnpj: "00.000.000/0001-00" },
    update: {
      email: "administrador@sgot.com", // Força atualização do email
    },
    create: {
      codigo: "EMP001",
      nome: "Contabilidade SGOT",
      cnpj: "00.000.000/0001-00",
      email: "administrador@sgot.com",
      telefone: "(47) 99999-0000",
      endereco: "Rua Principal, 100 - Joinville/SC",
    },
  });

  const empresa2 = await prisma.empresa.upsert({
    where: { cnpj: "11.111.111/0001-11" },
    update: {
      email: "contato@cliente-exemplo.com", // Força atualização do email
    },
    create: {
      codigo: "EMP002",
      nome: "Cliente Exemplo Ltda",
      cnpj: "11.111.111/0001-11",
      email: "contato@cliente-exemplo.com",
      telefone: "(47) 98888-1111",
      endereco: "Av. Central, 456 - Joinville/SC",
    },
  });

  const empresa3 = await prisma.empresa.upsert({
    where: { cnpj: "22.222.222/0001-22" },
    update: {
      email: "administrador@sgot.com", // Força atualização do email
    },
    create: {
      codigo: "EMP003",
      nome: "Comércio ABC ME",
      cnpj: "22.222.222/0001-22",
      email: "administrador@sgot.com",
      telefone: "(47) 97777-2222",
      endereco: "Rua das Flores, 789 - Joinville/SC",
    },
  });

  // Criar usuários
  const accountingSuper = await prisma.user.upsert({
    where: { email: 'admin@sgot.com' },
    update: {},
    create: {
      email: 'admin@sgot.com', 
      passwordHash, 
      name: 'Administrador',
      role: 'ACCOUNTING_SUPER',
      status: 'ACTIVE',
      companyId: empresa1.id
    },
  });

  const accountingAdmin = await prisma.user.upsert({
    where: { email: 'contabilidade@sgot.com' },
    update: {},
    create: {
      email: 'contabilidade@sgot.com', 
      passwordHash, 
      name: 'Contabilidade',
      role: 'ACCOUNTING_ADMIN',
      status: 'ACTIVE',
      companyId: empresa1.id
    },
  });

  // Usando email verificado no AWS SES
  const clientAdmin = await prisma.user.upsert({
    where: { email: 'contato@cliente-exemplo.com' },
    update: {},
    create: {
      email: 'contato@cliente-exemplo.com', 
      passwordHash, 
      name: 'Cliente Admin',
      role: 'CLIENT_ADMIN',
      status: 'ACTIVE',
      companyId: empresa2.id
    },
  });

  // Criar perfis fiscais (tipos de impostos) para as empresas
  // IMPORTANTE: EMP001 é a contabilidade, não deve ter impostos configurados
  // Apenas EMP002 e EMP003 são clientes e devem ter os 5 impostos padrão
  console.log('\n📋 Criando perfis fiscais para empresas clientes...');
  
  const tiposImpostos = ['DAS', 'ISS_RETIDO', 'FGTS', 'DCTFWeb', 'OUTRO'];
  
  // Empresa 2 (Cliente Exemplo Ltda) - Todos os 5 impostos
  for (const taxType of tiposImpostos) {
    await prisma.companyTaxProfile.upsert({
      where: { companyId_taxType: { companyId: empresa2.id, taxType } },
      update: {},
      create: { companyId: empresa2.id, taxType, isActive: true }
    });
  }

  // Empresa 3 (Comércio ABC ME) - Todos os 5 impostos
  for (const taxType of tiposImpostos) {
    await prisma.companyTaxProfile.upsert({
      where: { companyId_taxType: { companyId: empresa3.id, taxType } },
      update: {},
      create: { companyId: empresa3.id, taxType, isActive: true }
    });
  }

  console.log('✅ Perfis fiscais criados! (5 impostos x 2 empresas = 10 perfis)');

  // Criar calendário fiscal (vencimentos padrão dos impostos)
  console.log('\n📅 Criando calendário fiscal...');
  
  const vencimentos = [
    { taxType: 'DAS', dueDay: 20, description: 'DAS - Vence todo dia 20' },
    { taxType: 'ISS_RETIDO', dueDay: 15, description: 'ISS Retido - Vence todo dia 15' },
    { taxType: 'FGTS', dueDay: 7, description: 'FGTS - Vence todo dia 7' },
    { taxType: 'DCTFWeb', dueDay: 15, description: 'DCTFWeb - Vence todo dia 15' }
    // OUTRO não tem vencimento fixo
  ];

  for (const venc of vencimentos) {
    await prisma.taxCalendar.upsert({
      where: { taxType: venc.taxType },
      update: { dueDay: venc.dueDay, description: venc.description },
      create: venc
    });
  }

  console.log('✅ Calendário fiscal criado! (4 impostos com vencimentos fixos)');

  console.log('\n✅ Seed concluído!');
  console.log('\n📧 USUÁRIOS CRIADOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 SUPER ADMIN (Contabilidade)');
  console.log('   Email: admin@sgot.com');
  console.log('   Senha: secret123');
  console.log('   Role: ACCOUNTING_SUPER\n');
  console.log('📊 ADMIN (Contabilidade)');
  console.log('   Email: contabilidade@sgot.com');
  console.log('   Senha: secret123');
  console.log('   Role: ACCOUNTING_ADMIN\n');
  console.log('🏢 CLIENTE ADMIN');
  console.log('   Email: contato@cliente-exemplo.com');
  console.log('   Senha: secret123');
  console.log('   Role: CLIENT_ADMIN');
  console.log('   Empresa: Cliente Exemplo Ltda\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n🏢 EMPRESAS CRIADAS: ${[empresa1, empresa2, empresa3].length}`);
  console.log(`👥 USUÁRIOS CRIADOS: 3`);
  console.log(`\n💡 OBSERVAÇÃO: Use administrador@sgot.com para login de contabilidade`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
