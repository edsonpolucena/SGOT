const { 
  createObligation, 
  listObligations, 
  getObligation, 
  updateObligation, 
  deleteObligation,
  markAsNotApplicable,
  getMonthlyControl
} = require('./obligation.service');
const { createObligationFile, getObligationFiles, getFileViewUrl, getFileDownloadUrl, deleteObligationFile } = require('./obligation-file.service');
const { logAudit } = require('../../utils/audit.helper');
const { recordView } = require('../notifications/notification.service');
const emailService = require('../../services/email.service');
const { prisma } = require('../../prisma');

async function postObligation(req, res) {
  try {
    const { title, regime, periodStart, periodEnd, dueDate, amount, notes, companyId, taxType, referenceMonth, status, notApplicableReason } = req.body;
    
    if (!title || !regime || !periodStart || !periodEnd || !dueDate || !companyId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const obligationData = {
      title,
      regime,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      dueDate: new Date(dueDate),
      amount: amount ? parseFloat(amount) : null,
      notes,
      companyId: parseInt(companyId),
      taxType: taxType || null,
      referenceMonth: referenceMonth || null,
      status: status || undefined,
      notApplicableReason: notApplicableReason || null
    };

    const created = await createObligation(req.userId, obligationData);
    
    // Log de auditoria
    await logAudit(req, 'CREATE', 'Obligation', created.id, { title, regime, companyId, taxType, referenceMonth });
    
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getObligations(req, res) {
  try {
    const { status, regime, from, to, companyId, referenceMonth } = req.query;
    const items = await listObligations(req.userId, req.user.role, {
      status,
      regime,
      companyId: companyId ? parseInt(companyId) : undefined,
      referenceMonth,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    return res.json(items);
  } catch (error) {
    console.error('Error listing obligations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getObligationById(req, res) {
  try {
    const item = await getObligation(req.userId, req.user.role, req.params.id);
    if (!item) return res.status(404).json({ message: 'Obligation not found' });
    return res.json(item);
  } catch (error) {
    console.error('Error getting obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function putObligation(req, res) {
  try {
    const updated = await updateObligation(req.userId, req.user.role, req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Obligation not found' });
    
    // Log de auditoria
    await logAudit(req, 'UPDATE', 'Obligation', req.params.id, { fields: Object.keys(req.body) });
    
    return res.json(updated);
  } catch (error) {
    console.error('Error updating obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteObligationById(req, res) {
  try {
    const ok = await deleteObligation(req.userId, req.user.role, req.params.id);
    if (!ok) return res.status(404).json({ message: 'Obligation not found' });
    
    // Log de auditoria
    await logAudit(req, 'DELETE', 'Obligation', req.params.id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting obligation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Novos endpoints para gerenciamento de arquivos
async function uploadFiles(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const obligationId = req.params.id;
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileRecord = await createObligationFile(obligationId, file, req.userId);
      uploadedFiles.push(fileRecord);
      
      // Log de auditoria para cada arquivo
      await logAudit(req, 'UPLOAD', 'ObligationFile', fileRecord.id, { 
        fileName: file.originalname,
        obligationId 
      });
    }

    // Busca informações da obrigação para enviar email aos clientes
    const obligation = await prisma.obligation.findUnique({
      where: { id: obligationId },
      include: {
        company: {
          include: {
            users: {
              where: {
                role: { in: ['CLIENT_ADMIN', 'CLIENT_NORMAL'] },
                status: 'ACTIVE'
              }
            }
          }
        },
        user: {
          select: { name: true }
        }
      }
    });

    // Envia email para o email da empresa cliente
    if (obligation && obligation.company) {
      const metadata = JSON.parse(obligation.notes || '{}');
      const toEmail = obligation.company.email;

      if (toEmail) {
        console.log(`📧 Enviando notificação para empresa ${obligation.company.nome}...`);
        console.log(`   To: ${toEmail}`);
        
        try {
          // Buscar email remetente (empresa contabilidade)
          const accountingCompany = await prisma.empresa.findUnique({
            where: { codigo: 'EMP001' },
            select: { email: true }
          });
          const fromEmail = accountingCompany?.email;

          const result = await emailService.sendNewDocumentNotification({
            from: fromEmail,
            to: toEmail,
            userName: obligation.company.nome,
            companyName: obligation.company.nome,
            docType: metadata.docType || obligation.title,
            competence: metadata.competence || obligation.referenceMonth,
            dueDate: obligation.dueDate,
            uploadedBy: obligation.user.name || 'Contabilidade'
          });
          
          // Registrar notificação no banco
          await prisma.obligationNotification.create({
            data: {
              obligationId,
              sentTo: toEmail,
              sentBy: req.userId,
              emailStatus: result?.success ? 'sent' : 'failed',
              emailError: result?.error || null
            }
          });
          
          if (result?.success) {
            console.log(`   ✅ Email enviado com sucesso para ${toEmail}`);
          } else {
            console.log(`   ❌ Falha ao enviar: ${result?.error}`);
          }
        } catch (emailError) {
          console.error(`   ❌ Erro ao enviar email:`, emailError.message);
          // Não falha o upload se email não for enviado
        }
      } else {
        console.log(`⚠️  Empresa ${obligation.company.nome} sem email cadastrado`);
      }
    }

    return res.status(201).json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getFiles(req, res) {
  try {
    const files = await getObligationFiles(req.params.id, req.userId);
    return res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function viewFile(req, res) {
  try {
    const signedUrl = await getFileViewUrl(req.params.fileId, req.userId);
    
    // Buscar o arquivo para pegar o obligationId
    const { prisma } = require('../../prisma');
    const file = await prisma.obligationFile.findUnique({
      where: { id: req.params.fileId },
      select: { obligationId: true }
    });
    
    if (file) {
      // Registrar visualização APENAS para clientes (não para contabilidade)
      const userRole = req.user?.role;
      if (userRole && (userRole === 'CLIENT_NORMAL' || userRole === 'CLIENT_ADMIN')) {
        await recordView(file.obligationId, req.userId, 'VIEW');
      }
    }
    
    // Log de auditoria
    await logAudit(req, 'VIEW', 'ObligationFile', req.params.fileId);
    
    return res.json({ viewUrl: signedUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function downloadFile(req, res) {
  try {
    const signedUrl = await getFileDownloadUrl(req.params.fileId, req.userId);
    
    // Buscar o arquivo para pegar o obligationId
    const { prisma } = require('../../prisma');
    const file = await prisma.obligationFile.findUnique({
      where: { id: req.params.fileId },
      select: { obligationId: true }
    });
    
    if (file) {
      // Registrar download como visualização APENAS para clientes (não para contabilidade)
      const userRole = req.user?.role;
      if (userRole && (userRole === 'CLIENT_NORMAL' || userRole === 'CLIENT_ADMIN')) {
        await recordView(file.obligationId, req.userId, 'DOWNLOAD');
      }
    }
    
    // Log de auditoria
    await logAudit(req, 'DOWNLOAD', 'ObligationFile', req.params.fileId);
    
    return res.json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteFile(req, res) {
  try {
    const success = await deleteObligationFile(req.params.fileId, req.userId);
    if (!success) return res.status(404).json({ message: 'File not found' });
    
    // Log de auditoria
    await logAudit(req, 'DELETE', 'ObligationFile', req.params.fileId);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * PATCH /api/obligations/:id/mark-not-applicable
 * Marca obrigação como "Não Aplicável" (sem arquivo)
 */
async function markNotApplicable(req, res) {
  try {
    const { reason } = req.body;
    const updated = await markAsNotApplicable(req.userId, req.user.role, req.params.id, reason);
    
    if (!updated) {
      return res.status(404).json({ message: 'Obligation not found' });
    }

    // Log de auditoria
    await logAudit(req, 'STATUS_CHANGE', 'Obligation', req.params.id, { 
      status: 'NOT_APPLICABLE',
      reason 
    });
    
    return res.json(updated);
  } catch (error) {
    console.error('Error marking as not applicable:', error);
    if (error.message.includes('Apenas usuários da contabilidade')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /api/obligations/monthly-control?companyId=X&month=2025-01
 * Controle mensal de documentos
 */
async function getMonthlyControlData(req, res) {
  try {
    const { companyId, month } = req.query;

    if (!companyId || !month) {
      return res.status(400).json({ message: 'companyId e month são obrigatórios' });
    }

    // Verifica permissão
    if (req.user.role.startsWith('CLIENT_') && req.user.companyId !== parseInt(companyId)) {
      return res.status(403).json({ message: 'Acesso negado a esta empresa' });
    }

    const control = await getMonthlyControl(companyId, month);
    return res.json(control);
  } catch (error) {
    console.error('Error getting monthly control:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { 
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
};
