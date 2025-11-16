const {
  listTaxCalendar,
  getTaxCalendarByType,
  upsertTaxCalendar,
  deleteTaxCalendar
} = require('./tax-calendar.service');

async function getAll(req, res) {
  try {
    const items = await listTaxCalendar();
    return res.json(items);
  } catch (error) {
    console.error('Erro ao listar calendário fiscal:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function getByType(req, res) {
  try {
    const item = await getTaxCalendarByType(req.params.taxType);
    if (!item) {
      return res.status(404).json({ message: 'Vencimento não encontrado' });
    }
    return res.json(item);
  } catch (error) {
    console.error('Erro ao buscar vencimento:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function upsert(req, res) {
  try {
    const { taxType, dueDay, description } = req.body;

    if (!taxType || !dueDay) {
      return res.status(400).json({ message: 'taxType e dueDay são obrigatórios' });
    }

    if (dueDay < 1 || dueDay > 31) {
      return res.status(400).json({ message: 'dueDay deve estar entre 1 e 31' });
    }

    const item = await upsertTaxCalendar(taxType, dueDay, description);
    return res.json(item);
  } catch (error) {
    console.error('Erro ao salvar vencimento:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

async function remove(req, res) {
  try {
    await deleteTaxCalendar(req.params.taxType);
    return res.json({ message: 'Vencimento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover vencimento:', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
}

module.exports = {
  getAll,
  getByType,
  upsert,
  remove
};


