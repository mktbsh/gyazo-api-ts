#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createInterface } from "node:readline/promises";
import {
  createGyazoClient,
  deleteImage,
  getCurrentUser,
  getImage,
  getOEmbed,
  isHttpCommandError,
  listImages,
  searchImages,
  uploadImage,
} from "gyazo-api-sdk";
import { type CliCommand, helpText, parseCli } from "./cli";

const VERSION = "0.1.0";

async function main(): Promise<void> {
  const command = parseCli(process.argv.slice(2));
  if (command.kind === "help") {
    process.stdout.write(`${helpText(command.command)}\n`);
    return;
  }
  if (command.kind === "version") {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  const accessToken = process.env.GYAZO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "GYAZO_ACCESS_TOKEN is required. Set it in the environment and retry.",
    );
  }

  if (command.kind === "delete" && !(await confirmDelete(command))) return;

  const client = createGyazoClient({ accessToken });
  let result: unknown;
  switch (command.kind) {
    case "list":
      result = await client.send(
        listImages({
          ...(command.page === undefined ? {} : { page: command.page }),
          ...(command.perPage === undefined
            ? {}
            : { perPage: command.perPage }),
        }),
      );
      break;
    case "get":
      result = await client.send(getImage({ imageId: command.imageId }));
      break;
    case "upload": {
      const bytes = await readFile(command.file);
      result = await client.send(
        uploadImage({
          image: new Blob([new Uint8Array(bytes)]),
          filename: basename(command.file),
          ...(command.accessPolicy === undefined
            ? {}
            : { accessPolicy: command.accessPolicy }),
          ...(command.title === undefined ? {} : { title: command.title }),
          ...(command.desc === undefined ? {} : { desc: command.desc }),
        }),
      );
      break;
    }
    case "delete":
      result = await client.send(deleteImage({ imageId: command.imageId }));
      break;
    case "search":
      result = await client.send(
        searchImages({
          query: command.query,
          ...(command.page === undefined ? {} : { page: command.page }),
          ...(command.perPage === undefined
            ? {}
            : { perPage: command.perPage }),
        }),
      );
      break;
    case "me":
      result = await client.send(getCurrentUser());
      break;
    case "oembed":
      result = await client.send(getOEmbed({ url: command.url }));
      break;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function confirmDelete(
  command: Extract<CliCommand, { kind: "delete" }>,
): Promise<boolean> {
  if (command.yes) return true;
  if (!process.stdin.isTTY) {
    throw new Error("Deletion requires --yes when stdin is not interactive.");
  }

  const readline = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    const answer = await readline.question(
      `Delete image ${command.imageId}? [y/N] `,
    );
    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")
      return true;
    process.stderr.write("Cancelled.\n");
    return false;
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  if (isHttpCommandError(error)) {
    const status = error.status === undefined ? "" : ` (HTTP ${error.status})`;
    process.stderr.write(`gyazoctl: ${error.message}${status}\n`);
    if (error.body) process.stderr.write(`${error.body}\n`);
  } else {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`gyazoctl: ${message}\n`);
    process.stderr.write("Run 'gyazoctl --help' for usage.\n");
  }
  process.exitCode = 1;
});
