import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [version, arm64Sha256, x64Sha256, output] = process.argv.slice(2);
if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new TypeError("VERSION must be a semantic version");
}
for (const checksum of [arm64Sha256, x64Sha256]) {
  if (!checksum || !/^[a-f0-9]{64}$/.test(checksum)) {
    throw new TypeError("checksums must be lowercase SHA-256 values");
  }
}
if (!output) throw new TypeError("OUTPUT is required");

const template = await readFile(
  new URL("../homebrew/gyazoctl.rb.in", import.meta.url),
  "utf8",
);
const formula = template
  .replaceAll("__VERSION__", version)
  .replaceAll("__ARM64_SHA256__", arm64Sha256)
  .replaceAll("__X64_SHA256__", x64Sha256);
if (formula.includes("__")) throw new Error("Formula contains placeholders");

await mkdir(dirname(output), { recursive: true });
await writeFile(output, formula);
