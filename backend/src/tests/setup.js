// FILE: backend/src/tests/setup.js
// Jest test environment setup

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/secure_vault_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_S3_SIGNED_URL_EXPIRES = '3600';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = 'error'; // suppress logs in tests
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // disable rate limiting in tests
process.env.MAX_FILE_SIZE_MB = '50';
process.env.DEFAULT_STORAGE_QUOTA_MB = '10';
process.env.PORT = '5001';
process.env.API_VERSION = 'v1';
