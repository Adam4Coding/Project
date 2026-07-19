import app from "./app";
import { logger } from "./lib/logger";
import { removeSeededDemoData } from "./lib/demo-data-cleanup";
import { ensureVendorSubscriptionSchema } from "./lib/vendor-subscription";

const rawPort = process.env["PORT"] ?? "3000";
const parsedPort = Number(rawPort);
const port = Number.isNaN(parsedPort) || parsedPort <= 0 ? 3000 : parsedPort;

async function startServer() {
  await ensureVendorSubscriptionSchema();
  const demoCleanup = await removeSeededDemoData();
  if (demoCleanup.removedUsers > 0 || demoCleanup.removedVendors > 0) {
    logger.info(demoCleanup, "Removed seeded demo data");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });

}

void startServer().catch((err) => {
  logger.error({ err }, "Server startup failed");
  process.exit(1);
});
