const AWS = require('aws-sdk');
const { env } = require('../config/env');

const s3 = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = env.S3_BUCKET_NAME;

async function uploadFile(fileBuffer, fileName, mimeType, folder = 'documents') {
  try {
    const s3Key = `${folder}/${Date.now()}-${fileName}`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'private'
    };

    const result = await s3.upload(uploadParams).promise();
    
    return {
      s3Key: s3Key,
      s3Url: result.Location
    };
  } catch (error) {
    console.error('Erro no upload para S3:', error);
    throw new Error('Falha no upload do arquivo');
  }
}

function getSignedUrl(s3Key, expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn
    };
    
    return s3.getSignedUrl('getObject', params);
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
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    await s3.deleteObject(params).promise();
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
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    await s3.headObject(params).promise();
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

