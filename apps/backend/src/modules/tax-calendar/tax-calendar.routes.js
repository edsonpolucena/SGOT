const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/requireAuth');
const authorize = require('../../middleware/authorize');
const {
  getAll,
  getByType,
  upsert,
  remove
} = require('./tax-calendar.controller');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// GET /api/tax-calendar - Lista todos
router.get('/', authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']), getAll);

// GET /api/tax-calendar/:taxType - Busca por tipo
router.get('/:taxType', authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']), getByType);

// POST /api/tax-calendar - Cria ou atualiza
router.post('/', authorize(['ACCOUNTING_SUPER', 'ACCOUNTING_ADMIN']), upsert);

// DELETE /api/tax-calendar/:taxType - Remove
router.delete('/:taxType', authorize(['ACCOUNTING_SUPER']), remove);

module.exports = router;


