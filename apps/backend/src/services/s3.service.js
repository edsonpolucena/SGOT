const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: generateSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { env } = require('../config/env');
const { retryOperation } = require('../utils/retry.helper');

const s3Client = new S3Client({
  region: env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }
});

const BUCKET_NAME = env.S3_BUCKET_NAME;

async function uploadFile(fileBuffer, fileName, mimeType, folder = 'documents') {
  const s3Key = `${folder}/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'private'
  });

  try {
    await retryOperation(
      () => s3Client.send(command),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        operationName: `Upload S3: ${fileName}`
      }
    );
    
    const s3Url = `https://${BUCKET_NAME}.s3.${env.AWS_REGION || 'sa-east-1'}.amazonaws.com/${s3Key}`;
    
    return {
      s3Key: s3Key,
      s3Url: s3Url
    };
  } catch (error) {
    console.error('Erro no upload para S3 após todas as tentativas:', error);
    throw new Error('Falha no upload do arquivo após 3 tentativas');
  }
}

async function getSignedUrl(s3Key, expiresIn = 3600, forceDownload = false) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      // Forçar download se solicitado
      ...(forceDownload && { ResponseContentDisposition: 'attachment' })
    });
    
    return await generateSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);
    throw new Error('Falha ao gerar URL de download');
  }
}

/**
 * Deletar arquivo do S3
 * @param {string} s3Key - Chave do arquivo no S3
 * @returns {Promise<boolean>}
 */
async function deleteFile(s3Key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo do S3:', error);
    return false;
  }
}

/**
 * Verificar se arquivo existe no S3
 * @param {string} s3Key - Chave do arquivo no S3
 * @returns {Promise<boolean>}
 */
async function fileExists(s3Key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  uploadFile,
  getSignedUrl,
  deleteFile,
  fileExists
};

