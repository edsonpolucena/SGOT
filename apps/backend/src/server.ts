// apps/backend/src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import { PrismaClient } from "@prisma/client";

const app = express();
const logger = pino();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/obligations", async (_req, res) => {
  const data = await prisma.obligation.findMany({
    orderBy: { createdAt: "desc" }, take: 50
  });
  res.json(data);
});

app.post("/api/obligations", async (req, res) => {
  const { title, dueDate, taxpayerName } = req.body;
  if (!title || !dueDate || !taxpayerName) {
    return res.status(400).json({ error: "title, dueDate, taxpayerName são obrigatórios" });
  }
  const user = await prisma.user.findFirst();
  if (!user) return res.status(500).json({ error: "Sem usuário seed" });

  const created = await prisma.obligation.create({
    data: {
      title,
      dueDate: new Date(dueDate),
      taxpayerName,
      createdById: user.id,
    },
  });
  res.status(201).json(created);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => logger.info(`API on :${port}`));
