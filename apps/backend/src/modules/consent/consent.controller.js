const { createConsent, getUserConsent } = require('./consent.service');
const { logAudit } = require('../../utils/audit.helper');

async function postConsent(req, res) {
  try {
    const { consentAccepted } = req.body;
    const userId = req.userId;

    if (typeof consentAccepted !== 'boolean') {
      return res.status(400).json({ message: 'consentAccepted deve ser true ou false' });
    }

    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.connection?.remoteAddress || 
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';

    const consent = await createConsent(
      userId,
      consentAccepted,
      ipAddress,
      userAgent,
      '1.0'
    );

    await logAudit(req, 'CREATE', 'Auth', userId, {
      action: 'CONSENT',
      consentAccepted,
      consentId: consent.id
    });

    return res.status(200).json({
      success: true,
      consent: {
        id: consent.id,
        consentAccepted: consent.consentAccepted,
        consentDate: consent.consentDate
      }
    });
  } catch (error) {
    console.error('Erro ao processar consentimento:', error);
    return res.status(500).json({ message: 'Erro interno ao processar consentimento' });
  }
}

async function getConsent(req, res) {
  try {
    const userId = req.userId;
    const consent = await getUserConsent(userId);

    if (!consent) {
      return res.status(200).json({
        hasConsent: false,
        consentAccepted: null
      });
    }

    return res.status(200).json({
      hasConsent: true,
      consentAccepted: consent.consentAccepted,
      consentDate: consent.consentDate,
      termVersion: consent.termVersion
    });
  } catch (error) {
    console.error('Erro ao buscar consentimento:', error);
    return res.status(500).json({ message: 'Erro interno ao buscar consentimento' });
  }
}

module.exports = {
  postConsent,
  getConsent
};

