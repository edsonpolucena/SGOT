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
  let otherCompany;
  let extraUser;

  beforeAll(async () => {
    company = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}`,
        nome: 'Empresa Test',
        cnpj: `${Date.now()}000190`,
        status: 'ativa'
      }
    });

    otherCompany = await prisma.empresa.create({
      data: {
        codigo: `COMP${Date.now()}99`,
        nome: 'Empresa Secundária',
        cnpj: `${Date.now()}999190`,
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

    extraUser = await prisma.user.create({
      data: {
        email: `extra${Date.now()}@service.com`,
        name: 'Extra',
        passwordHash: await bcrypt.hash('password', 10),
        role: 'CLIENT_NORMAL',
        status: 'ACTIVE',
        companyId: otherCompany.id
      }
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.empresa.deleteMany();
  });

  // ---------------------------------------------------------------------
  // GET USERS
  // ---------------------------------------------------------------------
  describe('getUsers', () => {
    test('deve listar usuários', async () => {
      const users = await getUsers({}, adminUser);
      expect(Array.isArray(users)).toBe(true);
    });

    test('CLIENT_ADMIN deve ver apenas usuários da própria empresa', async () => {
      const users = await getUsers({}, clientAdmin);
      expect(users.every(u => u.companyId === company.id)).toBe(true);
    });

    test('filtro por role', async () => {
      const users = await getUsers({ role: 'CLIENT_NORMAL' }, adminUser);
      expect(users.every(u => u.role === 'CLIENT_NORMAL')).toBe(true);
    });

    test('filtro por companyId (ACCOUNTING)', async () => {
      const users = await getUsers({ companyId: company.id }, adminUser);
      expect(users.every(u => u.companyId === company.id)).toBe(true);
    });

    test('filtro por status', async () => {
      const users = await getUsers({ status: 'ACTIVE' }, adminUser);
      expect(users.every(u => u.status === 'ACTIVE')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------
  // GET USER BY ID
  // ---------------------------------------------------------------------
  describe('getUserById', () => {
    test('deve retornar usuário por ID', async () => {
      const user = await getUserById(normalUser.id, adminUser);
      expect(user.id).toBe(normalUser.id);
    });

    test('deve lançar USER_NOT_FOUND', async () => {
      await expect(getUserById('invalid-id', adminUser))
        .rejects.toThrow('USER_NOT_FOUND');
    });

    test('CLIENT_ADMIN não pode ver usuário de outra empresa', async () => {
      await expect(getUserById(extraUser.id, clientAdmin))
        .rejects.toThrow('FORBIDDEN');
    });
  });

  // ---------------------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------------------
  describe('updateUser', () => {
    test('deve atualizar nome', async () => {
      const updated = await updateUser(normalUser.id, { name: 'Novo Nome' }, adminUser);
      expect(updated.name).toBe('Novo Nome');
    });

    test('deve atualizar e-mail', async () => {
      const updated = await updateUser(normalUser.id, { email: 'new@mail.com' }, adminUser);
      expect(updated.email).toBe('new@mail.com');
    });

    test('deve atualizar senha', async () => {
      const updated = await updateUser(normalUser.id, { password: '12345678' }, adminUser);
      expect(updated).toBeDefined();
    });

    test('não deve permitir email já usado', async () => {
      const dummy = await prisma.user.create({
        data: {
          email: 'testemail@service.com',
          name: 'Dummy',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE'
        }
      });

      await expect(
        updateUser(normalUser.id, { email: 'testemail@service.com' }, adminUser)
      ).rejects.toThrow('EMAIL_IN_USE');

      await prisma.user.delete({ where: { id: dummy.id } });
    });

    test('CLIENT_ADMIN não pode alterar role para ACCOUNTING', async () => {
      await expect(
        updateUser(normalUser.id, { role: 'ACCOUNTING_ADMIN' }, clientAdmin)
      ).rejects.toThrow('FORBIDDEN_ROLE_CHANGE');
    });

    test('CLIENT_ADMIN não pode editar usuário de outra empresa', async () => {
      await expect(
        updateUser(extraUser.id, { name: 'Teste' }, clientAdmin)
      ).rejects.toThrow('FORBIDDEN');
    });

    test('deve lançar USER_NOT_FOUND', async () => {
      await expect(updateUser('invalid', { name: 'X' }, adminUser))
        .rejects.toThrow('USER_NOT_FOUND');
    });
  });

  // ---------------------------------------------------------------------
  // UPDATE USER STATUS
  // ---------------------------------------------------------------------
  describe('updateUserStatus', () => {
    test('deve inativar usuário', async () => {
      const updated = await updateUserStatus(normalUser.id, 'INACTIVE', adminUser);
      expect(updated.status).toBe('INACTIVE');
    });

    test('deve reativar usuário', async () => {
      const updated = await updateUserStatus(normalUser.id, 'ACTIVE', adminUser);
      expect(updated.status).toBe('ACTIVE');
    });

    test('CLIENT_ADMIN não pode alterar usuário de outra empresa', async () => {
      await expect(updateUserStatus(extraUser.id, 'INACTIVE', clientAdmin))
        .rejects.toThrow('FORBIDDEN');
    });

    test('não pode desativar a si mesmo', async () => {
      await expect(updateUserStatus(adminUser.id, 'INACTIVE', adminUser))
        .rejects.toThrow('CANNOT_DEACTIVATE_SELF');
    });

    test('deve lançar USER_NOT_FOUND', async () => {
      await expect(updateUserStatus('invalid', 'ACTIVE', adminUser))
        .rejects.toThrow('USER_NOT_FOUND');
    });
  });

  // ---------------------------------------------------------------------
  // DELETE USER (SOFT DELETE)
  // ---------------------------------------------------------------------
  describe('deleteUser', () => {
    test('deve deletar (soft delete)', async () => {
      const testUser = await prisma.user.create({
        data: {
          email: `delete${Date.now()}@test.com`,
          name: 'Delete Test',
          passwordHash: await bcrypt.hash('password', 10),
          role: 'CLIENT_NORMAL',
          status: 'ACTIVE',
          companyId: company.id
        }
      });

      const result = await deleteUser(testUser.id, adminUser);
      expect(result.message).toBe('Usuário desativado com sucesso');

      const deletedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(deletedUser.status).toBe('INACTIVE');
    });

    test('CLIENT_ADMIN não pode deletar usuário de outra empresa', async () => {
      await expect(deleteUser(extraUser.id, clientAdmin))
        .rejects.toThrow('FORBIDDEN');
    });

    test('não pode deletar a si mesmo', async () => {
      await expect(deleteUser(adminUser.id, adminUser))
        .rejects.toThrow('CANNOT_DELETE_SELF');
    });

    test('USER_NOT_FOUND ao deletar', async () => {
      await expect(deleteUser('invalid', adminUser))
        .rejects.toThrow('USER_NOT_FOUND');
    });
  });
});
