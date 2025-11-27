// apps/backend/src/tests/company.controller.test.js
const companyController = require('../modules/company/company.controller');
const companyService = require('../modules/company/company.service');

jest.mock('../modules/company/company.service');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

describe('CompanyController', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  describe('create', () => {
    it('deve criar empresa e retornar 201', async () => {
      const req = { body: { nome: 'Empresa Teste' } };
      const res = createMockRes();
      const empresaMock = { id: 1, nome: 'Empresa Teste' };

      companyService.create.mockResolvedValue(empresaMock);

      await companyController.create(req, res, next);

      expect(companyService.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(empresaMock);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro no create', async () => {
      const req = { body: { nome: 'Empresa Erro' } };
      const res = createMockRes();
      const error = new Error('Erro ao criar');

      companyService.create.mockRejectedValue(error);

      await companyController.create(req, res, next);

      expect(companyService.create).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('deve retornar lista de empresas', async () => {
      const req = {};
      const res = createMockRes();
      const empresasMock = [{ id: 1 }, { id: 2 }];

      companyService.getAll.mockResolvedValue(empresasMock);

      await companyController.getAll(req, res, next);

      expect(companyService.getAll).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(empresasMock);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro no getAll', async () => {
      const req = {};
      const res = createMockRes();
      const error = new Error('Erro ao listar');

      companyService.getAll.mockRejectedValue(error);

      await companyController.getAll(req, res, next);

      expect(companyService.getAll).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('deve buscar empresa por ID', async () => {
      const req = { params: { id: '10' } };
      const res = createMockRes();
      const empresaMock = { id: 10, nome: 'Empresa X' };

      companyService.getById.mockResolvedValue(empresaMock);

      await companyController.getById(req, res, next);

      expect(companyService.getById).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(empresaMock);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro no getById', async () => {
      const req = { params: { id: '10' } };
      const res = createMockRes();
      const error = new Error('Erro ao buscar empresa');

      companyService.getById.mockRejectedValue(error);

      await companyController.getById(req, res, next);

      expect(companyService.getById).toHaveBeenCalledWith(10);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('deve atualizar empresa', async () => {
      const req = { params: { id: '5' }, body: { nome: 'Atualizada' } };
      const res = createMockRes();
      const empresaAtualizada = { id: 5, nome: 'Atualizada' };

      companyService.update.mockResolvedValue(empresaAtualizada);

      await companyController.update(req, res, next);

      expect(companyService.update).toHaveBeenCalledWith(5, req.body);
      expect(res.json).toHaveBeenCalledWith(empresaAtualizada);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro no update', async () => {
      const req = { params: { id: '5' }, body: { nome: 'Erro' } };
      const res = createMockRes();
      const error = new Error('Erro ao atualizar');

      companyService.update.mockRejectedValue(error);

      await companyController.update(req, res, next);

      expect(companyService.update).toHaveBeenCalledWith(5, req.body);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('deve remover empresa e retornar 204', async () => {
      const req = { params: { id: '7' } };
      const res = createMockRes();

      companyService.remove.mockResolvedValue();

      await companyController.remove(req, res, next);

      expect(companyService.remove).toHaveBeenCalledWith(7);
      expect(res.sendStatus).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next em caso de erro no remove', async () => {
      const req = { params: { id: '7' } };
      const res = createMockRes();
      const error = new Error('Erro ao remover');

      companyService.remove.mockRejectedValue(error);

      await companyController.remove(req, res, next);

      expect(companyService.remove).toHaveBeenCalledWith(7);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
