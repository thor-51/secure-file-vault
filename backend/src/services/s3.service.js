// FILE: backend/src/services/s3.service.js
// AWS S3 operations: upload, presigned download URL, delete

const {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

const s3Service = {
  /**
   * Upload a file buffer to S3.
   * Returns the S3 key.
   */
  async upload({ key, buffer, mimeType, metadata = {} }) {
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      // Server-side encryption
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    return key;
  },

  /**
   * Generate a pre-signed download URL (valid for configured duration).
   */
  async getSignedDownloadUrl(key) {
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: env.AWS_S3_SIGNED_URL_EXPIRES,
    });
  },

  /**
   * Delete an object from S3.
   */
  async delete(key) {
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  },

  /**
   * Check if a key exists in S3.
   */
  async exists(key) {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Build a deterministic S3 key for a file.
   * Uses hash-based sharding to distribute objects in S3.
   * Format: uploads/{userId}/{hash[0:2]}/{hash[2:4]}/{hash}-{filename}
   */
  buildKey(userId, hash, originalName) {
    const ext = originalName.split('.').pop();
    const shard1 = hash.substring(0, 2);
    const shard2 = hash.substring(2, 4);
    return `uploads/${userId}/${shard1}/${shard2}/${hash}.${ext}`;
  },
};

module.exports = s3Service;
