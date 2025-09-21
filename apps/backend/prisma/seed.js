const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  // Primeiro, limpar dados existentes para evitar conflitos
  await prisma.obligation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.empresa.deleteMany({});

  const passwordHash = await bcrypt.hash('secret123', 10);

  // Criar empresas primeiro
  const empresa1 = await prisma.empresa.create({
    data: {
      codigo: "EMP001",
      nome: "Empresa XYZ Ltda",
      cnpj: "00.000.000/0001-00",
      email: "contato@empresaxyz.com",
      telefone: "(47) 99999-0000",
      endereco: "Rua das Flores, 123 - Joinville/SC",
    },
  });

  const empresa2 = await prisma.empresa.create({
    data: {
      codigo: "EMP002",
      nome: "Comércio ABC ME",
      cnpj: "11.111.111/0001-11",
      email: "financeiro@comercioabc.com",
      telefone: "(47) 98888-1111",
      endereco: "Av. Central, 456 - Joinville/SC",
    },
  });

  // Criar usuários
  const accountingUser = await prisma.user.create({
    data: {
      email: 'contabilidade@sgot.com', 
      passwordHash, 
      name: 'Contabilidade',
      role: 'ACCOUNTING'
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'cliente@sgot.com', 
      passwordHash, 
      name: 'Cliente Teste',
      role: 'CLIENT',
      companyId: empresa1.id // Associar cliente à primeira empresa
    },
  });

  // Criar obrigações usando os IDs das empresas criadas
  await prisma.obligation.createMany({
    data: [
      {
        title: 'DAS - Set/2025',
        regime: 'SIMPLES',
        periodStart: new Date('2025-09-01T00:00:00Z'),
        periodEnd:   new Date('2025-09-30T00:00:00Z'),
        dueDate:     new Date('2025-10-20T00:00:00Z'),
        notes: 'Padaria Bom Pão ME',
        userId: clientUser.id,
        companyId: empresa1.id,
        amount: 150.00,
      },
      {
        title: 'GFIP - Ago/2025',
        regime: 'LUCRO_PRESUMIDO',
        periodStart: new Date('2025-08-01T00:00:00Z'),
        periodEnd:   new Date('2025-08-31T00:00:00Z'),
        dueDate:     new Date('2025-09-07T00:00:00Z'),
        notes: 'Mecânica Boa Vista LTDA',
        userId: clientUser.id,
        companyId: empresa2.id,
        amount: 2500.00,
      },
    ],
  });

  console.log('✅ Seed concluído');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
