import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(
    new URL("../packages/gyazoctl/package.json", import.meta.url),
    "utf8",
  ),
);
const version = manifest.version;
assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);

const sourceUrl = new URL("../packages/gyazoctl/src/index.ts", import.meta.url);
const source = await readFile(sourceUrl, "utf8");
const pattern = /^const VERSION = "[^"]+";$/gm;
assert.equal(
  source.match(pattern)?.length,
  1,
  "CLI version constant not found",
);
await writeFile(
  sourceUrl,
  source.replace(pattern, `const VERSION = "${version}";`),
);
