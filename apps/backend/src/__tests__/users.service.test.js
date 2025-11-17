const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
} = require('../modules/users/users.service');
const { prisma } = require('../prisma');
const bcrypt = require('bcryptjs');

describe('Users Service', () => {
  let adminUser;
  let normalUser;
  let clientAdmin;
  let company;

  beforeAll(async () => {
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Test',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@userservice.com',
        name: 'Admin',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'ACCOUNTING_SUPER',
        status: 'ACTIVE'
      }
    });

    normalUser = await prisma.user.create({
      data: {
        email: 'normal@userservice.com',
        name: 'Normal User',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    clientAdmin = await prisma.user.create({
      data: {
        email: 'clientadmin@userservice.com',
        name: 'Client Admin',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_ADMIN',
        status: 'ACTIVE',
        companyId: company.id
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  describe('getUsers', () => {
    test('deve listar usuários', async () => {
      const users = await getUsers({}, adminUser);
      expect(Array.isArray(users)).toBe(true);
    });

    test('deve filtrar usuários por role', async () => {
      const users = await getUsers({ role: 'CLIENT_NORMAL' }, adminUser);
      expect(users.every(u => u.role === 'CLIENT_NORMAL')).toBe(true);
    });

    test('CLIENT_ADMIN deve ver apenas usuários da própria empresa', async () => {
      const users = await getUsers({}, clientAdmin);
      expect(users.every(u => u.companyId === company.id)).toBe(true);
    });
  });

  describe('getUserById', () => {
    test('deve buscar usuário por ID', async () => {
      const user = await getUserById(normalUser.id, adminUser);
      expect(user.id).toBe(normalUser.id);
    });

    test('deve lançar erro se usuário não encontrado', async () => {
      await expect(getUserById('invalid-id', adminUser))
        .rejects.toThrow('USER_NOT_FOUND');
    });
  });

  describe('updateUser', () => {
    test('deve atualizar usuário', async () => {
      const updated = await updateUser(normalUser.id, { name: 'Updated Name' }, adminUser);
      expect(updated.name).toBe('Updated Name');
    });

    test('deve atualizar email do usuário', async () => {
      const newEmail = 'updated@userservice.com';
      const updated = await updateUser(normalUser.id, { email: newEmail }, adminUser);
      expect(updated.email).toBe(newEmail);
    });

    test('deve atualizar senha do usuário', async () => {
      const updated = await updateUser(normalUser.id, { password: 'newPassword123' }, adminUser);
      expect(updated).toBeDefined();
    });

    test('deve lançar erro se email já estiver em uso', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'existing@userservice.com',
          name: 'Existing User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      await expect(updateUser(normalUser.id, { email: 'existing@userservice.com' }, adminUser))
        .rejects.toThrow('EMAIL_IN_USE');

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test('CLIENT_ADMIN não deve alterar role para ACCOUNTING', async () => {
      await expect(updateUser(normalUser.id, { role: 'ACCOUNTING_SUPER' }, clientAdmin))
        .rejects.toThrow('FORBIDDEN_ROLE_CHANGE');
    });

    test('CLIENT_ADMIN não deve editar usuário de outra empresa', async () => {
      const otherCompany = await prisma.empresa.create({
        data: {
          codigo: `OTHER${Date.now()}`,
          nome: 'Other Company',
          cnpj: `${Date.now()}000191`,
          status: 'ativa'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: `other${Date.now()}@test.com`,
          name: 'Other User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: otherCompany.id
        }
      });

      await expect(updateUser(otherUser.id, { name: 'Test' }, clientAdmin))
        .rejects.toThrow('FORBIDDEN');

      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.empresa.delete({ where: { id: otherCompany.id } });
    });
  });

  describe('updateUserStatus', () => {
    test('deve atualizar status do usuário', async () => {
      const updated = await updateUserStatus(normalUser.id, 'INACTIVE', adminUser);
      expect(updated.status).toBe('INACTIVE');
    });

    test('deve reativar usuário', async () => {
      const updated = await updateUserStatus(normalUser.id, 'ACTIVE', adminUser);
      expect(updated.status).toBe('ACTIVE');
    });

    test('não deve permitir que usuário desative a si mesmo', async () => {
      await expect(updateUserStatus(adminUser.id, 'INACTIVE', adminUser))
        .rejects.toThrow('CANNOT_DEACTIVATE_SELF');
    });
  });

  describe('deleteUser', () => {
    test('deve deletar usuário (soft delete)', async () => {
      const testUser = await prisma.user.create({
        data: {
          email: `delete${Date.now()}@test.com`,
          name: 'Delete User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      const result = await deleteUser(testUser.id, adminUser);
      expect(result).toHaveProperty('message', 'Usuário desativado com sucesso');

      const deleted = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(deleted.status).toBe('INACTIVE');
    });
  });

  describe('getUsers com filtros', () => {
    test('deve filtrar por companyId', async () => {
      const users = await getUsers({ companyId: company.id }, adminUser);
      expect(users.every(u => u.companyId === company.id)).toBe(true);
    });

    test('deve filtrar por status', async () => {
      const users = await getUsers({ status: 'ACTIVE' }, adminUser);
      expect(users.every(u => u.status === 'ACTIVE')).toBe(true);
    });
  });

  describe('getUserById com restrições', () => {
    test('CLIENT_ADMIN não deve ver usuário de outra empresa', async () => {
      const otherCompany = await prisma.empresa.create({
        data: {
          codigo: `OTHER${Date.now()}`,
          nome: 'Other Company',
          cnpj: `${Date.now()}000191`,
          status: 'ativa'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: `other${Date.now()}@test.com`,
          name: 'Other User',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: otherCompany.id
        }
      });

      await expect(getUserById(otherUser.id, clientAdmin)).rejects.toThrow('FORBIDDEN');

      await prisma.user.delete({ where: { id: otherUser.id } });
      await prisma.empresa.delete({ where: { id: otherCompany.id } });
    });
  });
});













