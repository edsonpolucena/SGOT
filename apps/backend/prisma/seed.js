const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('secret123', 10);

  const accountingUser = await prisma.user.upsert({
    where: { email: 'contabilidade@sgot.com' },
    update: { passwordHash, name: 'Contabilidade', role: 'ACCOUNTING' },
    create: { 
      email: 'contabilidade@sgot.com', 
      passwordHash, 
      name: 'Contabilidade',
      role: 'ACCOUNTING'
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@sgot.com' },
    update: { passwordHash, name: 'Cliente Teste', role: 'CLIENT' },
    create: { 
      email: 'cliente@sgot.com', 
      passwordHash, 
      name: 'Cliente Teste',
      role: 'CLIENT'
    },
  });

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
        companyId: 1,
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
        companyId: 2, // Assumindo que a segunda empresa tem ID 2
        amount: 2500.00,
      },
    ],
  });

  // insere empresas
  await prisma.empresa.createMany({
    data: [
      {
        codigo: "EMP001",
        nome: "Empresa XYZ Ltda",
        cnpj: "00.000.000/0001-00",
        email: "contato@empresaxyz.com",
        telefone: "(47) 99999-0000",
        endereco: "Rua das Flores, 123 - Joinville/SC",
      },
      {
        codigo: "EMP002",
        nome: "Comércio ABC ME",
        cnpj: "11.111.111/0001-11",
        email: "financeiro@comercioabc.com",
        telefone: "(47) 98888-1111",
        endereco: "Av. Central, 456 - Joinville/SC",
      },
    ],
    skipDuplicates: true,
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
