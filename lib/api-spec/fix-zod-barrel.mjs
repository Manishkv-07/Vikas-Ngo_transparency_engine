import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const barrel = resolve(__dirname, "..", "api-zod", "src", "index.ts");
writeFileSync(barrel, 'export * from "./generated/api";\n');
