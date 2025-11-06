const { Router } = require("express");
const { requireAuth } = require('../../middleware/requireAuth');
const { validate, validateParams, companySchema, updateCompanySchema, idParamSchema } = require('../../middleware/validation');
const companyController = require("./company.controller.js");
const taxProfileRoutes = require('./company-tax-profile.routes');

const router = Router();
router.use(requireAuth); // Todas as rotas de empresa precisam de autenticação

// Rotas de empresa
router.post("/", validate(companySchema), companyController.create);
router.get("/", companyController.getAll);
router.get("/:id", validateParams(idParamSchema), companyController.getById);
router.put("/:id", validateParams(idParamSchema), validate(updateCompanySchema), companyController.update);
router.delete("/:id", validateParams(idParamSchema), companyController.remove);

// Rotas de perfil fiscal (tax-profile)
router.use("/", taxProfileRoutes);

module.exports = router;
