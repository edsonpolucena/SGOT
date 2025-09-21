require('dotenv').config();

module.exports = {
  env: {
    PORT: Number(process.env.PORT ?? 3333),
    JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION ?? 'us-east-1',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  }
};
