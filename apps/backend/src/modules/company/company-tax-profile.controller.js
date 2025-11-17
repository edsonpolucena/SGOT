const {
  getCompanyTaxProfile,
  addTaxToCompany,
  removeTaxFromCompany,
  setCompanyTaxProfile,
  getAvailableTaxTypes
} = require('./company-tax-profile.service');

/**
 * GET /api/companies/:companyId/tax-profile
 * Lista tipos de impostos configurados para uma empresa
 */
async function listCompanyTaxProfile(req, res) {
  try {
    const { companyId } = req.params;

    // Verifica permissão
    const user = req.user;
    if (user.role.startsWith('CLIENT_') && user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ error: 'Acesso negado a esta empresa' });
    }

    const profiles = await getCompanyTaxProfile(companyId);
    
    res.json(profiles);
  } catch (error) {
    console.error('Erro ao listar perfil fiscal:', error);
    res.status(500).json({ error: 'Erro ao listar perfil fiscal da empresa' });
  }
}

/**
 * POST /api/companies/:companyId/tax-profile
 * Adiciona um tipo de imposto ao perfil
 */
async function addTaxProfile(req, res) {
  try {
    const { companyId } = req.params;
    const { taxType } = req.body;

    if (!taxType) {
      return res.status(400).json({ error: 'taxType é obrigatório' });
    }

    // Apenas contabilidade pode modificar
    if (!req.user.role.startsWith('ACCOUNTING_')) {
      return res.status(403).json({ error: 'Apenas usuários da contabilidade podem modificar perfis fiscais' });
    }

    const profile = await addTaxToCompany(companyId, taxType);
    
    res.status(201).json(profile);
  } catch (error) {
    console.error('Erro ao adicionar imposto:', error);
    if (error.message.includes('já está configurado')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao adicionar imposto ao perfil' });
  }
}

/**
 * DELETE /api/companies/:companyId/tax-profile/:taxType
 * Remove um tipo de imposto do perfil
 */
async function removeTaxProfile(req, res) {
  try {
    const { companyId, taxType } = req.params;

    // Apenas contabilidade pode modificar
    if (!req.user.role.startsWith('ACCOUNTING_')) {
      return res.status(403).json({ error: 'Apenas usuários da contabilidade podem modificar perfis fiscais' });
    }

    await removeTaxFromCompany(companyId, taxType);
    
    res.json({ message: 'Imposto removido do perfil com sucesso' });
  } catch (error) {
    console.error('Erro ao remover imposto:', error);
    if (error.message === 'Configuração não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao remover imposto do perfil' });
  }
}

/**
 * PUT /api/companies/:companyId/tax-profile
 * Configura todos os impostos de uma vez
 */
async function updateCompanyTaxProfile(req, res) {
  try {
    const { companyId } = req.params;
    const { taxTypes } = req.body;

    if (!Array.isArray(taxTypes)) {
      return res.status(400).json({ error: 'taxTypes deve ser um array' });
    }

    // Apenas contabilidade pode modificar
    if (!req.user.role.startsWith('ACCOUNTING_')) {
      return res.status(403).json({ error: 'Apenas usuários da contabilidade podem modificar perfis fiscais' });
    }

    const profiles = await setCompanyTaxProfile(companyId, taxTypes);
    
    res.json(profiles);
  } catch (error) {
    console.error('Erro ao atualizar perfil fiscal:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil fiscal da empresa' });
  }
}

/**
 * GET /api/companies/tax-types/available
 * Lista tipos de impostos disponíveis no sistema
 */
function listAvailableTaxTypes(req, res) {
  const taxTypes = getAvailableTaxTypes();
  res.json(taxTypes);
}

module.exports = {
  listCompanyTaxProfile,
  addTaxProfile,
  removeTaxProfile,
  updateCompanyTaxProfile,
  listAvailableTaxTypes
};

