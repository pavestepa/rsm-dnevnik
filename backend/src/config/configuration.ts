export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isDev = nodeEnv === 'development';

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv,
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      name: process.env.DB_NAME ?? 'rsm_dnevnik',
    },
    s3: {
      endpoint:
        process.env.S3_ENDPOINT ?? (isDev ? 'http://localhost:9000' : ''),
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'rsm-dnevnik',
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? (isDev ? 'minioadmin' : ''),
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY ?? (isDev ? 'minioadmin' : ''),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      presignExpiresIn: parseInt(
        process.env.S3_PRESIGN_EXPIRES_IN ?? '3600',
        10,
      ),
      publicBaseUrl:
        process.env.S3_PUBLIC_BASE_URL ??
        process.env.S3_ENDPOINT ??
        (isDev ? 'http://localhost:9000' : ''),
      ensureBucketOnStartup:
        isDev && process.env.S3_ENSURE_BUCKET_ON_STARTUP !== 'false',
    },
    auth: {
      usersFilePath: process.env.USERS_FILE_PATH ?? '../users.json',
      accessTokenSecret:
        process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      accessTokenExpiresIn: parseInt(
        process.env.JWT_ACCESS_EXPIRES_IN ?? '900',
        10,
      ),
      refreshTokenExpiresInDays: parseInt(
        process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? '7',
        10,
      ),
    },
    throttle: {
      authTtl: parseInt(process.env.THROTTLE_AUTH_TTL ?? '60000', 10),
      authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
    },
    cors: {
      origins:
        process.env.CORS_ORIGINS?.split(',')
          .map((origin) => origin.trim())
          .filter(Boolean) ?? [],
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD ?? '',
      keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'rsm:',
    },
    expo: {
      accessToken: process.env.EXPO_ACCESS_TOKEN ?? '',
    },
    swagger: {
      enabled: process.env.SWAGGER_ENABLED !== 'false',
    },
  };
};
