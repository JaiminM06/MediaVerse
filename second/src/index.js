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