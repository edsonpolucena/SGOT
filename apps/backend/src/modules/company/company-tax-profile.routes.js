const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const {
  listCompanyTaxProfile,
  addTaxProfile,
  removeTaxProfile,
  updateCompanyTaxProfile,
  listAvailableTaxTypes
} = require('./company-tax-profile.controller');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// GET /api/companies/tax-types/available - Lista tipos disponíveis
router.get(
  '/tax-types/available',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL']),
  listAvailableTaxTypes
);

// GET /api/companies/:companyId/tax-profile - Lista perfil da empresa
router.get(
  '/:companyId/tax-profile',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN', 'ACCOUNTING_NORMAL', 'CLIENT_ADMIN']),
  listCompanyTaxProfile
);

// POST /api/companies/:companyId/tax-profile - Adiciona imposto
router.post(
  '/:companyId/tax-profile',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']),
  addTaxProfile
);

// PUT /api/companies/:companyId/tax-profile - Atualiza perfil completo
router.put(
  '/:companyId/tax-profile',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']),
  updateCompanyTaxProfile
);

// DELETE /api/companies/:companyId/tax-profile/:taxType - Remove imposto
router.delete(
  '/:companyId/tax-profile/:taxType',
  authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']),
  removeTaxProfile
);

module.exports = router;

