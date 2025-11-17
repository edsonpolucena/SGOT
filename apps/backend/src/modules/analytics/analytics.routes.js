const express = require("express");
const router = express.Router();
const { 
  getMonthlySummary, 
  monthlyVariationByTax,
  getDocumentControlDashboard,
  getTaxTypeStats,
  getClientTaxReport,
  getDeadlineCompliance,
  getOverdueAndUpcoming,
  getUnviewedAlerts
} = require("./analytics.controller");
const { requireAuth } = require("../../middleware/requireAuth");

router.get("/monthly-summary", requireAuth, getMonthlySummary);
router.get("/variation-by-tax", requireAuth, monthlyVariationByTax);
router.get("/document-control-dashboard", requireAuth, getDocumentControlDashboard);
router.get("/tax-type-stats", requireAuth, getTaxTypeStats);
router.get("/client-tax-report", requireAuth, getClientTaxReport);
router.get("/deadline-compliance", requireAuth, getDeadlineCompliance);
router.get("/overdue-and-upcoming", requireAuth, getOverdueAndUpcoming);
router.get("/unviewed-alerts", requireAuth, getUnviewedAlerts);

// Manter compatibilidade com rota antiga
router.get("/summary", requireAuth, getMonthlySummary);

module.exports = router;
