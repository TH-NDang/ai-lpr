import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import { env } from "./env";

dotenv.config({ path: ".env" });

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
