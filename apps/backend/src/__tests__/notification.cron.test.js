const cron = require('node-cron');

const mockSchedule = jest.fn((expression, fn) => {
  // retorna objeto com método run que podemos chamar manualmente nos testes
  return { expression, run: fn, start: jest.fn(), stop: jest.fn() };
});

jest.mock('node-cron', () => {
  return {
    schedule: mockSchedule
  };
});

const mockFindMany = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      obligation: { findMany: mockFindMany },
      passwordResetToken: { deleteMany: mockDeleteMany }
    }))
  };
});

const mockSendDocumentReminderEmail = jest.fn();
const mockSendUnviewedDocumentAlert = jest.fn();

jest.mock('../services/email.service', () => ({
  sendDocumentReminderEmail: jest.fn((...args) => mockSendDocumentReminderEmail(...args)),
  sendUnviewedDocumentAlert: jest.fn((...args) => mockSendUnviewedDocumentAlert(...args))
}));

const mockCleanExpiredTokens = jest.fn();

jest.mock('../modules/auth/password-reset.service', () => ({
  cleanExpiredTokens: (...args) => mockCleanExpiredTokens(...args)
}));

const {
  startDocumentReminderJob,
  startUnviewedDocumentAlertJob,
  startTokenCleanupJob
} = require('../jobs/notification.cron');

describe('notification.cron jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('startDocumentReminderJob deve buscar obrigações e enviar emails por empresa', async () => {
    // cron.schedule é chamado e retorna objeto com run()
    startDocumentReminderJob();

    expect(mockSchedule).toHaveBeenCalledTimes(1);

    const job = mockSchedule.mock.results[0].value;

    mockFindMany.mockResolvedValue([
      {
        id: 'obl-1',
        taxType: 'DAS',
        title: 'DAS 10/2025',
        dueDate: new Date(),
        createdAt: new Date(),
        company: { email: 'empresa1@test.com', nome: 'Empresa 1', codigo: 'EMP002' }
      },
      {
        id: 'obl-2',
        taxType: 'ISS',
        title: 'ISS 10/2025',
        dueDate: new Date(),
        createdAt: new Date(),
        company: { email: 'empresa1@test.com', nome: 'Empresa 1', codigo: 'EMP002' }
      }
    ]);

    await job.run();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendDocumentReminderEmail).toHaveBeenCalledTimes(1);
    expect(mockSendDocumentReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'empresa1@test.com',
        companyName: 'Empresa 1',
        obligations: expect.any(Array)
      })
    );
  });

  it('startDocumentReminderJob deve sair sem enviar emails quando não há obrigações', async () => {
    startDocumentReminderJob();
    const job = mockSchedule.mock.results[0].value;

    mockFindMany.mockResolvedValue([]);

    await job.run();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendDocumentReminderEmail).not.toHaveBeenCalled();
  });

  it('startUnviewedDocumentAlertJob deve enviar alertas por usuário', async () => {
    startUnviewedDocumentAlertJob();
    const job = mockSchedule.mock.results[0].value;

    mockFindMany.mockResolvedValue([
      {
        id: 'obl-1',
        taxType: 'DAS',
        title: 'DAS 10/2025',
        dueDate: new Date(),
        createdAt: new Date(),
        company: {
          nome: 'Empresa 1',
          users: [
            { email: 'user1@test.com', name: 'User 1' },
            { email: 'user2@test.com', name: 'User 2' }
          ]
        }
      }
    ]);

    await job.run();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendUnviewedDocumentAlert).toHaveBeenCalledTimes(2);
    expect(mockSendUnviewedDocumentAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user1@test.com',
        userName: 'User 1',
        obligations: expect.any(Array)
      })
    );
  });

  it('startUnviewedDocumentAlertJob deve sair sem enviar alertas quando não há obrigações', async () => {
    startUnviewedDocumentAlertJob();
    const job = mockSchedule.mock.results[0].value;

    mockFindMany.mockResolvedValue([]);

    await job.run();

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockSendUnviewedDocumentAlert).not.toHaveBeenCalled();
  });

  it('startTokenCleanupJob deve chamar cleanExpiredTokens', async () => {
    mockCleanExpiredTokens.mockResolvedValue(3);

    startTokenCleanupJob();
    const job = mockSchedule.mock.results[0].value;

    await job.run();

    expect(mockCleanExpiredTokens).toHaveBeenCalledTimes(1);
  });
});


