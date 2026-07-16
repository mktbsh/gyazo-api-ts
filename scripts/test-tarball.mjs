import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryDirectory = mkdtempSync(join(tmpdir(), "gyazo-api-consumer-"));
const npmCache = join(temporaryDirectory, "npm-cache");
let tarball;

try {
  const packed = JSON.parse(
    execFileSync(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--cache", npmCache],
      {
        cwd: root,
        encoding: "utf8",
      },
    ),
  );
  tarball = join(root, packed[0].filename);

  writeFileSync(
    join(temporaryDirectory, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  execFileSync(
    "npm",
    ["install", "--ignore-scripts", "--cache", npmCache, tarball],
    {
      cwd: temporaryDirectory,
      stdio: "inherit",
    },
  );

  writeFileSync(
    join(temporaryDirectory, "consumer.mjs"),
    `import { createGyazoClient } from "@mktbsh/gyazo-api";
const client = createGyazoClient({
  accessToken: "test",
  fetch: async () => new Response("[]", {
    headers: { "content-type": "application/json", "x-total-count": "0" },
  }),
});
const result = await client.images.list();
if (!result.ok || result.value.totalCount !== 0) process.exit(1);
`,
  );
  execFileSync(process.execPath, [join(temporaryDirectory, "consumer.mjs")], {
    cwd: temporaryDirectory,
    stdio: "inherit",
  });

  writeFileSync(
    join(temporaryDirectory, "consumer.ts"),
    `import { createGyazoClient, type GyazoClientError } from "@mktbsh/gyazo-api";
const client = createGyazoClient({ accessToken: "test" });
const result = await client.images.list({ perPage: 10 });
if (result.ok) result.value.totalCount satisfies number | undefined;
else result.error satisfies GyazoClientError;
`,
  );
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      join(temporaryDirectory, "consumer.ts"),
    ],
    { cwd: temporaryDirectory, stdio: "inherit" },
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
  if (tarball) rmSync(tarball, { force: true });
}
