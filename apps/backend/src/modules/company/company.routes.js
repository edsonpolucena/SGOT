const { Router } = require("express");
const { requireAuth } = require('../../middleware/requireAuth');
const { validate, validateParams, companySchema, updateCompanySchema, idParamSchema } = require('../../middleware/validation');
const companyController = require("./company.controller.js");

const router = Router();
router.use(requireAuth); // Todas as rotas de empresa precisam de autenticação

router.post("/", validate(companySchema), companyController.create);
router.get("/", companyController.getAll);
router.get("/:id", validateParams(idParamSchema), companyController.getById);
router.put("/:id", validateParams(idParamSchema), validate(updateCompanySchema), companyController.update);
router.delete("/:id", validateParams(idParamSchema), companyController.remove);

module.exports = router;
