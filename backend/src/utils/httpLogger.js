import pinoHttp from 'pino-http';
import { logger } from './logger.js';

export const httpLogger = pinoHttp({
  logger,                    // reuse the same pino instance

  // Do not log health check or docs routes
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url?.startsWith('/api-docs')
  },

  // Customize what gets logged on each request
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400)        return 'warn';
    return 'info';
  },

  // Customize the log message
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} → ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} → ${res.statusCode} — ${err.message}`,

  // Serialize request/response fields
  serializers: {
    req: (req) => ({
      method:    req.method,
      url:       req.url,
      userAgent: req.headers['user-agent']
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});
