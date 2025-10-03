const crypto = require('crypto');

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');


// Verificar se S3 está configurado
const isS3Configured = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME;

let storage;

if (isS3Configured) {
  // Usar S3 se configurado
  const s3Client = new S3Client({
    region: env.AWS_REGION || 'sa-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    }
  });

  storage = multerS3({
    s3: s3Client,
    bucket: env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomString}-${file.originalname}`;
      cb(null, `obligations/${fileName}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {
        uploadedBy: req.userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    }
  });
} else {
  // Usar armazenamento local se S3 não estiver configurado
  const uploadDir = path.join(__dirname, '../../uploads');
  
  // Criar diretório se não existir
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      //const randomString = Math.random().toString(36).substring(2, 15);
      const randomString = crypto.randomBytes(8).toString('hex');

      const fileName = `${timestamp}-${randomString}-${file.originalname}`;
      cb(null, fileName);
    }
  });
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'application/pdf',
      'text/xml',
      'application/xml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, XML e Excel são aceitos.'), false);
    }
  }
});

const uploadMultiple = upload.array('files', 5);

const uploadSingle = upload.single('file');

const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'Arquivo muito grande. Tamanho máximo: 10MB' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Muitos arquivos. Máximo: 5 arquivos' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de arquivo inesperado' 
      });
    }
  }
  
  if (error.message.includes('Tipo de arquivo não permitido')) {
    return res.status(400).json({ 
      message: error.message 
    });
  }
  
  next(error);
};

module.exports = {
  uploadMultiple,
  uploadSingle,
  handleUploadError
};

