const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  // Primeiro, limpar dados existentes para evitar conflitos
  // await prisma.obligation.deleteMany({});
  // await prisma.user.deleteMany({});
  // await prisma.empresa.deleteMany({});

  const passwordHash = await bcrypt.hash('secret123', 10);

  // Criar empresas primeiro
  const empresa1 = await prisma.empresa.upsert({
    data: {
      codigo: "EMP001",
      nome: "Empresa XYZ Ltda",
      cnpj: "00.000.000/0001-00",
      email: "contato@empresaxyz.com",
      telefone: "(47) 99999-0000",
      endereco: "Rua das Flores, 123 - Joinville/SC",
    },
  });

  const empresa2 = await prisma.empresa.upsert({
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
  const accountingUser = await prisma.user.upsert({
    data: {
      email: 'contabilidade@sgot.com', 
      passwordHash, 
      name: 'Contabilidade',
      role: 'ACCOUNTING_SUPER',
      status: 'ACTIVE'
    },
  });

  const clientUser = await prisma.user.upsert({
    data: {
      email: 'cliente@sgot.com', 
      passwordHash, 
      name: 'Cliente Teste',
      role: 'CLIENT_ADMIN',
      status: 'ACTIVE',
      companyId: empresa1.id // Associar cliente à primeira empresa
    },
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
