const { prisma } = require('../../prisma');

async function getUserConsent(userId) {
  return await prisma.consentLog.findUnique({
    where: { userId }
  });
}

async function hasUserConsented(userId) {
  const consent = await getUserConsent(userId);
  return consent?.consentAccepted === true;
}

async function createConsent(userId, consentAccepted, ipAddress, userAgent, termVersion = '1.0') {
  return await prisma.consentLog.upsert({
    where: { userId },
    update: {
      consentAccepted,
      consentDate: new Date(),
      ipAddress,
      userAgent,
      termVersion
    },
    create: {
      userId,
      consentAccepted,
      ipAddress,
      userAgent,
      termVersion
    }
  });
}

module.exports = {
  getUserConsent,
  hasUserConsented,
  createConsent
};

