import { registerAs } from '@nestjs/config';
import { StorageType } from '../enums';

export const s3Configuration = registerAs('awsS3', () => ({
  awsS3Region: process.env.AWS_S3_REGION,
  awsS3AccessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  awsS3SecretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  awsS3BucketName: process.env.AWS_S3_BUCKET_NAME,
  awsS3Url: process.env.AWS_S3_URL,
  awsS3CredentialsRequired: process.env.AWS_S3_CREDENTIALS_REQUIRED === 'true',
  storageType: process.env.STORAGE_TYPE || StorageType.S3,
}));
