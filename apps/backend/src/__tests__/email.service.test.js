// Mock completo do nodemailer
const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

// Mock do Prisma
jest.mock('../prisma', () => ({
  prisma: {
    empresa: {
      findUnique: jest.fn()
    }
  }
}));

const nodemailer = require('nodemailer');
const { prisma } = require('../prisma');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup env vars
    process.env.SES_SMTP_USER = 'test@example.com';
    process.env.SES_SMTP_PASS = 'testpass';
    process.env.EMAIL_FROM = 'noreply@example.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.EMAIL_ENABLED = 'true';
    
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
    
    // Clear module cache
    delete require.cache[require.resolve('../services/email.service')];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sendEmail deve chamar transporter.sendMail', async () => {
    const { sendEmail } = require('../services/email.service');
    
    await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(mockSendMail).toHaveBeenCalled();
  });

  test('getDefaultFromEmail retorna null sem COMPANY_DEFAULT_ID', async () => {
    process.env.COMPANY_DEFAULT_ID = '';
    prisma.empresa.findUnique.mockResolvedValue(null);
    delete require.cache[require.resolve('../services/email.service')];
    
    const { getDefaultFromEmail } = require('../services/email.service');
    const email = await getDefaultFromEmail();
    
    expect(email).toBeNull();
  });

  test('getDefaultFromEmail retorna email da empresa quando COMPANY_DEFAULT_ID existe', async () => {
    process.env.COMPANY_DEFAULT_ID = '123';
    prisma.empresa.findUnique.mockResolvedValue({
      id: 123,
      email: 'contato@empresa.com.br'
    });
    delete require.cache[require.resolve('../services/email.service')];
    
    const { getDefaultFromEmail } = require('../services/email.service');
    const email = await getDefaultFromEmail();
    
    expect(email).toBe('contato@empresa.com.br');
  });

  test('getTransporter retorna null quando EMAIL_ENABLED=false', () => {
    process.env.EMAIL_ENABLED = 'false';
    delete require.cache[require.resolve('../services/email.service')];
    
    const { getTransporter } = require('../services/email.service');
    const transporter = getTransporter();
    
    expect(transporter).toBeNull();
  });

  test('getTransporter retorna null quando credenciais não estão configuradas', () => {
    delete process.env.SES_SMTP_USER;
    delete process.env.SES_SMTP_PASS;
    process.env.EMAIL_ENABLED = 'true';
    delete require.cache[require.resolve('../services/email.service')];
    
    const { getTransporter } = require('../services/email.service');
    const transporter = getTransporter();
    
    expect(transporter).toBeNull();
  });

  test('sendNewDocumentNotification deve enviar email', async () => {
    const { sendNewDocumentNotification } = require('../services/email.service');
    
    const result = await sendNewDocumentNotification({
      to: 'test@example.com',
      userName: 'Test User',
      companyName: 'Test Company',
      docType: 'DAS',
      competence: '01/2025',
      dueDate: new Date('2025-02-10'),
      uploadedBy: 'Admin'
    });

    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toHaveProperty('success');
  });

  test('sendPasswordResetEmail deve enviar email', async () => {
    const { sendPasswordResetEmail } = require('../services/email.service');
    
    const result = await sendPasswordResetEmail({
      to: 'test@example.com',
      userName: 'Test User',
      resetLink: 'http://localhost:5173/reset-password?token=abc123',
      expiresInMinutes: 60
    });

    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toHaveProperty('success');
  });

  test('sendPasswordChangedConfirmation deve enviar email', async () => {
    const { sendPasswordChangedConfirmation } = require('../services/email.service');
    
    const result = await sendPasswordChangedConfirmation({
      to: 'test@example.com',
      userName: 'Test User'
    });

    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toHaveProperty('success');
  });

  test('sendDocumentReminderEmail deve enviar email', async () => {
    const { sendDocumentReminderEmail } = require('../services/email.service');
    
    const result = await sendDocumentReminderEmail({
      to: 'test@example.com',
      companyName: 'Test Company',
      obligations: [
        {
          taxType: 'DAS',
          title: 'DAS 01/2025',
          dueDate: new Date('2025-02-10'),
          createdAt: new Date('2025-01-15')
        }
      ]
    });

    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toHaveProperty('success');
  });

  test('sendUnviewedDocumentAlert deve enviar email', async () => {
    const { sendUnviewedDocumentAlert } = require('../services/email.service');
    
    const result = await sendUnviewedDocumentAlert({
      to: 'test@example.com',
      userName: 'Test User',
      obligations: [
        {
          taxType: 'DAS',
          title: 'DAS 01/2025',
          companyName: 'Test Company',
          dueDate: new Date('2025-02-10'),
          createdAt: new Date('2025-01-15')
        }
      ]
    });

    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toHaveProperty('success');
  });

  test('sendEmail deve usar from do parâmetro quando fornecido', async () => {
    const { sendEmail } = require('../services/email.service');
    
    await sendEmail({
      from: 'custom@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'custom@example.com'
      })
    );
  });

  test('sendEmail deve retornar erro quando transporter falha', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP Error'));
    
    const { sendEmail } = require('../services/email.service');
    
    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
  });
});
