const express = require("express");
const router = express.Router();
const { getMonthlySummary, monthlyVariationByTax } = require("./analytics.controller");
const { requireAuth } = require("../../middleware/requireAuth");

router.get("/summary", requireAuth, getMonthlySummary);

router.get("/variation-by-tax", requireAuth, monthlyVariationByTax);

module.exports = router;
