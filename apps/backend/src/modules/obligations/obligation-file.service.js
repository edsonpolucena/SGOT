const { prisma } = require('../../prisma');
const s3Service = require('../../services/s3.service');

async function createObligationFile(obligationId, fileInfo, uploadedBy) {
  try {
    const file = await prisma.obligationFile.create({
      data: {
        obligationId,
        fileName: fileInfo.key.split('/').pop(),
        originalName: fileInfo.originalname,
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimetype,
        s3Key: fileInfo.key,
        s3Url: fileInfo.location,
        uploadedBy
      }
    });

    return file;
  } catch (error) {
    console.error('Erro ao criar registro de arquivo:', error);
    throw new Error('Falha ao salvar informações do arquivo');
  }
}

async function getObligationFiles(obligationId, userId) {
  try {
    const obligation = await prisma.obligation.findFirst({
      where: {
        id: obligationId,
        OR: [
          { userId: userId },
          { 
            user: { 
              role: 'ACCOUNTING_SUPER'
            }
          }
        ]
      }
    });

    if (!obligation) {
      throw new Error('Obrigação não encontrada ou acesso negado');
    }

    const files = await prisma.obligationFile.findMany({
      where: { obligationId },
      orderBy: { createdAt: 'desc' }
    });

    return files;
  } catch (error) {
    console.error('Erro ao buscar arquivos da obrigação:', error);
    throw error;
  }
}

/**
 * Gerar URL assinada para visualização (abre no navegador)
 * @param {string} fileId - ID do arquivo
 * @param {string} userId - ID do usuário
 * @returns {Promise<string>} URL assinada
 */
async function getFileViewUrl(fileId, userId) {
  try {
    const file = await prisma.obligationFile.findUnique({
      where: { id: fileId },
      include: {
        obligation: {
          include: {
            user: true
          }
        }
      }
    });

    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    const hasAccess = file.obligation.userId === userId || 
                     file.obligation.user.role === 'ACCOUNTING_SUPER';

    if (!hasAccess) {
      throw new Error('Acesso negado ao arquivo');
    }

    const signedUrl = s3Service.getSignedUrl(file.s3Key, 3600, false); // false = não força download
    
    return signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL de visualização:', error);
    throw error;
  }
}

/**
 * Gerar URL assinada para download (força download)
 * @param {string} fileId - ID do arquivo
 * @param {string} userId - ID do usuário
 * @returns {Promise<string>} URL assinada
 */
async function getFileDownloadUrl(fileId, userId) {
  try {
    const file = await prisma.obligationFile.findUnique({
      where: { id: fileId },
      include: {
        obligation: {
          include: {
            user: true
          }
        }
      }
    });

    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    const hasAccess = file.obligation.userId === userId || 
                     file.obligation.user.role === 'ACCOUNTING_SUPER';

    if (!hasAccess) {
      throw new Error('Acesso negado ao arquivo');
    }

    const signedUrl = s3Service.getSignedUrl(file.s3Key, 3600, true); // true = forceDownload
    
    return signedUrl;
  } catch (error) {
    console.error('Erro ao gerar URL de download:', error);
    throw error;
  }
}

/**
 * Deletar arquivo
 * @param {string} fileId - ID do arquivo
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} Sucesso da operação
 */
async function deleteObligationFile(fileId, userId) {
  try {
    const file = await prisma.obligationFile.findUnique({
      where: { id: fileId },
      include: {
        obligation: {
          include: {
            user: true
          }
        }
      }
    });

    if (!file) {
      throw new Error('Arquivo não encontrado');
    }

    const canDelete = file.obligation.userId === userId || 
                     file.obligation.user.role === 'ACCOUNTING_SUPER';

    if (!canDelete) {
      throw new Error('Permissão negada para deletar arquivo');
    }

    const s3Deleted = await s3Service.deleteFile(file.s3Key);
    
    await prisma.obligationFile.delete({
      where: { id: fileId }
    });

    return s3Deleted;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
}

/**
 * Verificar se usuário tem acesso à obrigação
 * @param {string} obligationId - ID da obrigação
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} Tem acesso
 */
async function hasAccessToObligation(obligationId, userId) {
  try {
    const obligation = await prisma.obligation.findFirst({
      where: {
        id: obligationId,
        OR: [
          { userId: userId },
          { 
            user: { 
              role: 'ACCOUNTING_SUPER'
            }
          }
        ]
      }
    });

    return !!obligation;
  } catch (error) {
    console.error('Erro ao verificar acesso à obrigação:', error);
    return false;
  }
}

module.exports = {
  createObligationFile,
  getObligationFiles,
  getFileViewUrl,
  getFileDownloadUrl,
  deleteObligationFile,
  hasAccessToObligation
};

