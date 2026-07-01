import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // In development: use pino-pretty for colored, readable output
  // In production: raw JSON (fastest, works with log aggregators like Datadog/Loki)
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false
        }
      }
    : undefined,

  // Serialize errors properly (includes stack trace)
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err
  },

  // Base fields added to every log line
  base: {
    env: process.env.NODE_ENV || 'development'
  }
});

export default logger;
