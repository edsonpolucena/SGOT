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
  });

  describe('updateUserStatus', () => {
    test('deve atualizar status do usuário', async () => {
      const updated = await updateUserStatus(normalUser.id, 'INACTIVE', adminUser);
      expect(updated.status).toBe('INACTIVE');
    });
  });
});






