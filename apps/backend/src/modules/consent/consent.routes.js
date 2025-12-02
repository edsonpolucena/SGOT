const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { validate } = require('../../middleware/validation');
const { consentSchema } = require('../../middleware/validation');
const { postConsent, getConsent } = require('./consent.controller');

const consentRouter = Router();

consentRouter.use(requireAuth);

consentRouter.post('/', validate(consentSchema), postConsent);
consentRouter.get('/', getConsent);

module.exports = { consentRouter };

