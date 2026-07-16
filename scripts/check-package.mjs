import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporaryDirectory = mkdtempSync(join(tmpdir(), "gyazo-api-package-"));

try {
  execFileSync(
    "bun",
    ["pm", "pack", "--destination", temporaryDirectory, "--ignore-scripts"],
    { cwd: root, stdio: "inherit" },
  );
  const filename = readdirSync(temporaryDirectory).find((name) =>
    name.endsWith(".tgz"),
  );
  if (!filename) throw new Error("bun pack did not create a tarball");
  const tarball = join(temporaryDirectory, filename);

  execFileSync("publint", [tarball, "--pack=false"], {
    cwd: root,
    stdio: "inherit",
  });
  execFileSync("attw", [tarball, "--profile", "esm-only"], {
    cwd: root,
    stdio: "inherit",
  });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
