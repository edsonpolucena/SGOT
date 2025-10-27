const { prisma } = require('../prisma');

// Mock completo do nodemailer
const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

const nodemailer = require('nodemailer');

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup env vars
    process.env.SES_SMTP_USER = 'test@example.com';
    process.env.SES_SMTP_PASS = 'testpass';
    process.env.EMAIL_FROM = 'noreply@example.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
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
    delete require.cache[require.resolve('../services/email.service')];
    
    const { getDefaultFromEmail } = require('../services/email.service');
    const email = await getDefaultFromEmail();
    
    expect(email).toBeNull();
  });
});
