// FILE: backend/src/services/s3.service.js
// AWS S3 operations: upload, presigned download URL, delete
// When S3_MOCK=true, all operations are no-ops (for local dev / load testing)

const {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');
const env = require('../config/env');

const MOCK = process.env.S3_MOCK === 'true';

const s3Service = {
  async upload({ key, buffer, mimeType, metadata = {} }) {
    if (MOCK) return key;
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    });
    await s3Client.send(command);
    return key;
  },

  async getSignedDownloadUrl(key) {
    if (MOCK) return `https://mock-s3.local/${key}?signed=mock`;
    const command = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3Client, command, {
      expiresIn: env.AWS_S3_SIGNED_URL_EXPIRES,
    });
  },

  async delete(key) {
    if (MOCK) return;
    const command = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  },

  async exists(key) {
    if (MOCK) return false;
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  },

  buildKey(userId, hash, originalName) {
    const ext = originalName.split('.').pop();
    const shard1 = hash.substring(0, 2);
    const shard2 = hash.substring(2, 4);
    return `uploads/${userId}/${shard1}/${shard2}/${hash}.${ext}`;
  },
};

module.exports = s3Service;
