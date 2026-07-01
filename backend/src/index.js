import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn:                process.env.SENTRY_DSN,
    environment:        process.env.NODE_ENV || 'development',
    tracesSampleRate:   0.1,
    profilesSampleRate: 0.1
  });
}

import "dotenv/config";
import http from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./config/socket.js";
import { initTypesenseCollections } from "./config/typesenseCollections.js";
import { logger } from "./utils/logger.js";

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRY',
  'REFRESH_TOKEN_EXPIRY',
  'PORT'
];

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('FATAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  console.error('Server cannot start without these variables.');
  process.exit(1);
}

const server = http.createServer(app);
initSocket(server);

connectDB()
    .then(async () => {
        try {
            await initTypesenseCollections();
        } catch (tsError) {
            logger.error({ err: tsError }, "Typesense initialization failed");
        }
        server.listen(process.env.PORT || 8000, () => {
            logger.info(`Server is running on port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        logger.error({ err }, "MongoDB connection failed");
    });