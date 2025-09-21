const { prisma } = require("../../prisma.js");

function create(data) {
  return prisma.empresa.create({ data });
}

function getAll() {
  return prisma.empresa.findMany();
}

function getById(id) {
  return prisma.empresa.findUnique({ where: { id } });
}

function update(id, data) {
  return prisma.empresa.update({ where: { id }, data });
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
