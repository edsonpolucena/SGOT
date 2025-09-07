// apps/backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.upsert({
    where: { email: "dev@sgto.local" },
    update: {},
    create: { email: "dev@sgto.local", passwordHash: "x" },
  });

  await prisma.obligation.createMany({
    data: [
      {
        title: "DAS - Set/2025",
        dueDate: new Date("2025-09-20"),
        taxpayerName: "Padaria Bom Pão ME",
        createdById: user.id,
      },
      {
        title: "GFIP - Ago/2025",
        dueDate: new Date("2025-09-07"),
        taxpayerName: "Mecânica Boa Vista LTDA",
        createdById: user.id,
      },
    ],
  });
}

run().finally(() => prisma.$disconnect());
