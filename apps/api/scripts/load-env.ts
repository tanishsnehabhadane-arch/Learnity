/**
 * Loads the monorepo root .env. Import this BEFORE anything that reads config:
 * ESM evaluates imports depth-first in order, so this side effect runs first.
 */
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";

dotenvConfig({ path: resolve(process.cwd(), "../../.env") });
