const express = require("express");
const router = express.Router();
const { 
  getMonthlySummary, 
  monthlyVariationByTax,
  getDocumentControlDashboard
} = require("./analytics.controller");
const { requireAuth } = require("../../middleware/requireAuth");

router.get("/monthly-summary", requireAuth, getMonthlySummary);
router.get("/variation-by-tax", requireAuth, monthlyVariationByTax);
router.get("/document-control-dashboard", requireAuth, getDocumentControlDashboard);

// Manter compatibilidade com rota antiga
router.get("/summary", requireAuth, getMonthlySummary);

module.exports = router;
