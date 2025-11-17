const { prisma } = require("../../prisma");

function create(data) {
  return prisma.empresa.create({ data });
}

function getAll() {
  return prisma.empresa.findMany();
}

function getById(id) {
  return prisma.empresa.findUnique({ where: { id } });
}

async function update(id, data) {
  // Remover campos undefined antes de atualizar
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );
  
  return prisma.empresa.update({ where: { id }, data: filteredData });
}

function remove(id) {
  return prisma.empresa.delete({ where: { id } });
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
