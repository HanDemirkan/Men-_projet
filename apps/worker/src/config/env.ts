import { workerEnvSchema } from "./env.schema";
import type { WorkerEnv } from "./env.schema";

// This is the only place in the worker app allowed to read `process.env`
// directly. Every other module receives configuration through this typed object.
export function loadWorkerEnv(): WorkerEnv {
  const result = workerEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid worker environment configuration: ${issues}`);
  }

  return result.data;
}
