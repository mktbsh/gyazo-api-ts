import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const binary = process.argv[2];
if (!binary) throw new TypeError("Usage: native-smoke.mjs BINARY [VERSION]");

const packageJson = JSON.parse(
  await readFile(new URL("../packages/gyazoctl/package.json", import.meta.url)),
);
const expectedVersion = process.argv[3] ?? packageJson.version;
if (typeof expectedVersion !== "string") {
  throw new TypeError("Expected a package version");
}

const environment = { ...process.env };
delete environment.GYAZO_ACCESS_TOKEN;

const version = run(["--version"], environment);
assert.equal(version.status, 0);
assert.equal(version.stdout, `${expectedVersion}\n`);

const help = run(["list", "--help"], environment);
assert.equal(help.status, 0);
assert.match(help.stdout, /Usage:\n {2}gyazoctl list/);

const missingToken = run(["list", "--per-page", "1"], environment);
assert.equal(missingToken.status, 1);
assert.match(missingToken.stderr, /GYAZO_ACCESS_TOKEN is required/);

const deleteSafety = run(
  ["delete", "smoke-test"],
  { ...environment, GYAZO_ACCESS_TOKEN: "invalid" },
  "",
);
assert.equal(deleteSafety.status, 1);
assert.match(deleteSafety.stderr, /Deletion requires --yes/);

process.stdout.write(`native smoke passed (${expectedVersion})\n`);

function run(args, env, input) {
  return spawnSync(binary, args, {
    encoding: "utf8",
    env,
    input,
  });
}
