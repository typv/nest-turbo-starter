import { s3Configuration, StorageType } from '@app/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly s3Url: string;

  constructor(
    @Inject(s3Configuration.KEY)
    private readonly s3Config: ConfigType<typeof s3Configuration>,
  ) {
    this.bucket = this.s3Config.awsS3BucketName;
    this.s3Url = this.s3Config.awsS3Url;

    this.s3Client = new S3Client({
      region: this.s3Config.awsS3Region,
      ...(this.s3Config.storageType === StorageType.Minio
        ? {
            endpoint: this.s3Url,
            forcePathStyle: true,
          }
        : {}),
      credentials: this.s3Config.awsS3CredentialsRequired
        ? {
            accessKeyId: this.s3Config.awsS3AccessKeyId,
            secretAccessKey: this.s3Config.awsS3SecretAccessKey,
          }
        : undefined,
    });
  }

  async getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    bucketFolder?: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const fileKey = bucketFolder
      ? `${bucketFolder.replace(/^\/|\/$/g, '')}/${fileName}`
      : fileName;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    const baseUrl = this.s3Url.replace(/\/+$/, '');
    const fileUrl = `${baseUrl}/${encodeURI(fileKey)}`;

    return { uploadUrl, fileUrl };
  }

  async uploadFile(
    fileName: string,
    contentType: string,
    body: Buffer,
    bucketFolder?: string,
  ): Promise<{ fileKey: string }> {
    const fileKey = bucketFolder ? `${bucketFolder}/${fileName}` : `${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);

    return { fileKey };
  }
}
