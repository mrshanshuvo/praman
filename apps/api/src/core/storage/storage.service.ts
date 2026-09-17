import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../config/env.config.js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const accountId = this.configService.get('R2_ACCOUNT_ID', { infer: true });
    const accessKeyId = this.configService.get('R2_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.configService.get('R2_SECRET_ACCESS_KEY', { infer: true });
    this.bucketName = this.configService.get('R2_BUCKET_NAME', { infer: true }) || 'praman-resumes';

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`Cloudflare R2 Storage initialized for bucket: ${this.bucketName}`);
    } else {
      this.logger.warn(
        'Cloudflare R2 credentials missing in environment. Storage operations will be mocked.',
      );
    }
  }

  /**
   * Uploads a file (text or buffer) to Cloudflare R2
   */
  async uploadFile(
    key: string,
    content: string | Buffer,
    contentType = 'text/plain',
  ): Promise<string> {
    if (!this.s3Client) {
      this.logger.warn(`StorageService mocked upload for key: ${key}`);
      return `mock://r2/${this.bucketName}/${key}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully uploaded ${key} to Cloudflare R2 (${this.bucketName})`);
      return `r2://${this.bucketName}/${key}`;
    } catch (err: any) {
      this.logger.error(`Failed to upload to R2 (${key}): ${err.message}`);
      throw err;
    }
  }

  /**
   * Reads a file content from Cloudflare R2 as a UTF-8 string
   */
  async getFileString(key: string): Promise<string | null> {
    if (!this.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      if (!response.Body) return null;
      return await response.Body.transformToString('utf-8');
    } catch (err: any) {
      this.logger.warn(`Could not fetch object from R2 (${key}): ${err.message}`);
      return null;
    }
  }

  /**
   * Generates a temporary presigned download URL (valid for specified seconds, default 15 mins)
   */
  async getPresignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    if (!this.s3Client) {
      return `http://localhost:5000/mock-download/${key}`;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (err: any) {
      this.logger.error(`Failed to generate presigned URL for ${key}: ${err.message}`);
      throw err;
    }
  }
}
