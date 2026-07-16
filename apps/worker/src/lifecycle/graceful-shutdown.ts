import type pino from "pino";

export type ShutdownHandler = () => Promise<void>;

const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT"] as const;

export function registerGracefulShutdown(logger: pino.Logger, onShutdown: ShutdownHandler): void {
  let shuttingDown = false;

  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;

      logger.info({ signal }, "Received shutdown signal, closing worker gracefully");

      onShutdown()
        .then(() => {
          logger.info("Worker shut down gracefully");
          process.exit(0);
        })
        .catch((error: unknown) => {
          logger.error({ err: error }, "Error during worker shutdown");
          process.exit(1);
        });
    });
  }
}
