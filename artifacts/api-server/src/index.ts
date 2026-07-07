import app from "./app";
import { logger } from "./lib/logger";
import { connectToDatabase } from "./lib/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/**
 * Connect to MongoDB Atlas first, then start the HTTP server.
 * If the DB connection fails the process exits so we don't serve
 * requests against an unavailable database.
 */
connectToDatabase()
  .then(() => {
    logger.info("Connected to MongoDB Atlas");

    // Start the Express server only after a successful DB connection
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, "Failed to connect to MongoDB — shutting down");
    process.exit(1);
  });
