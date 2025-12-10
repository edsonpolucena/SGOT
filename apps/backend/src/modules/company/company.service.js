const { prisma } = require("../../prisma");
const { sanitizeString, sanitizeStringSoft } = require("../../utils/obligation.utils");

const DEFAULT_TAX_TYPES = ['DAS', 'ISS_RETIDO', 'FGTS', 'DCTFWeb', 'OUTRO'];

async function create(data) {
  const sanitizedData = {
    ...data,
    codigo: data.codigo ? sanitizeString(data.codigo, 20) : data.codigo,
    nome: data.nome ? sanitizeString(data.nome, 200) : data.nome,
    endereco: data.endereco ? sanitizeStringSoft(data.endereco, 500) : data.endereco
  };
  
  const empresa = await prisma.empresa.create({ data: sanitizedData });
  
  if (empresa.codigo !== 'EMP001') {
    const taxProfiles = DEFAULT_TAX_TYPES.map(taxType => ({
      companyId: empresa.id,
      taxType,
      isActive: true
    }));
    
    await prisma.companyTaxProfile.createMany({
      data: taxProfiles
    });
  }
  
  return empresa;
}

function getAll() {
  return prisma.empresa.findMany();
}

function getById(id) {
  return prisma.empresa.findUnique({ where: { id } });
}

async function update(id, data) {
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );
  
  if (filteredData.codigo !== undefined) filteredData.codigo = filteredData.codigo ? sanitizeString(filteredData.codigo, 20) : filteredData.codigo;
  if (filteredData.nome !== undefined) filteredData.nome = filteredData.nome ? sanitizeString(filteredData.nome, 200) : filteredData.nome;
  if (filteredData.endereco !== undefined) filteredData.endereco = filteredData.endereco ? sanitizeStringSoft(filteredData.endereco, 500) : filteredData.endereco;
  
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
