const companyService = require("./company.service.js");

async function create(req, res, next) {
  try {
    const empresa = await companyService.create(req.body);
    res.status(201).json(empresa);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const empresas = await companyService.getAll();
    res.json(empresas);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const empresa = await companyService.getById(Number(req.params.id));
    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const empresa = await companyService.update(Number(req.params.id), req.body);
    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await companyService.remove(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};
