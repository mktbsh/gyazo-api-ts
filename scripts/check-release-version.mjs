import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new TypeError("Usage: check-release-version.mjs VERSION");
}

for (const packageName of ["gyazo-api-sdk", "gyazoctl"]) {
  const manifest = JSON.parse(
    await readFile(
      new URL(`../packages/${packageName}/package.json`, import.meta.url),
    ),
  );
  assert.equal(manifest.version, version, `${packageName} version mismatch`);
}

process.stdout.write(`release version ${version} matches both packages\n`);
