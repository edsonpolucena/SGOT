const { Router } = require('express');
const { requireAuth } = require('../../middleware/requireAuth');
const { uploadMultiple, handleUploadError } = require('../../middleware/upload');
const { 
  validate, 
  validateParams, 
  validateQuery,
  obligationSchema,
  idParamSchema,
  fileIdParamSchema,
  obligationFiltersSchema
} = require('../../middleware/validation');
const {
  postObligation, 
  getObligations, 
  getObligationById, 
  putObligation, 
  deleteObligationById,
  uploadFiles,
  getFiles,
  viewFile,
  downloadFile,
  deleteFile,
  markNotApplicable,
  getMonthlyControlData
} = require('./obligation.controller');

const obligationRouter = Router();
obligationRouter.use(requireAuth);

obligationRouter.post('/', validate(obligationSchema), postObligation);
obligationRouter.get('/', validateQuery(obligationFiltersSchema), getObligations);
obligationRouter.get('/monthly-control', getMonthlyControlData); // ANTES de /:id
obligationRouter.get('/:id', validateParams(idParamSchema), getObligationById);
obligationRouter.put('/:id', validateParams(idParamSchema), validate(obligationSchema), putObligation);
obligationRouter.patch('/:id/mark-not-applicable', validateParams(idParamSchema), markNotApplicable);
obligationRouter.delete('/:id', validateParams(idParamSchema), deleteObligationById);

obligationRouter.post('/:id/files', validateParams(idParamSchema), uploadMultiple, handleUploadError, uploadFiles);
obligationRouter.get('/:id/files', validateParams(idParamSchema), getFiles);
obligationRouter.get('/files/:fileId/view', validateParams(fileIdParamSchema), viewFile);
obligationRouter.get('/files/:fileId/download', validateParams(fileIdParamSchema), downloadFile);
obligationRouter.delete('/files/:fileId', validateParams(fileIdParamSchema), deleteFile);

module.exports = { obligationRouter };
