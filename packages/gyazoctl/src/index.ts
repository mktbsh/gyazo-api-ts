#!/usr/bin/env node

import { readSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  createGyazoClient,
  deleteImage,
  getCurrentUser,
  getImage,
  getOEmbed,
  listImages,
  searchImages,
  uploadImageBytes,
} from "gyazo-api-sdk";
import { type CliCommand, helpText, parseCli } from "./cli";

const VERSION = "0.1.1";

async function main(): Promise<void> {
  const command = parseCli(process.argv.slice(2));
  if (command.kind === "help") {
    const helpCommand = "command" in command ? command.command : undefined;
    process.stdout.write(`${helpText(helpCommand)}\n`);
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
  if (command.kind === "list") {
    if (command.page !== undefined && command.perPage !== undefined) {
      result = await client.send(
        listImages({ page: command.page, perPage: command.perPage }),
      );
    } else if (command.page !== undefined) {
      result = await client.send(listImages({ page: command.page }));
    } else if (command.perPage !== undefined) {
      result = await client.send(listImages({ perPage: command.perPage }));
    } else {
      result = await client.send(listImages());
    }
  } else if (command.kind === "get") {
    result = await client.send(getImage({ imageId: command.imageId }));
  } else if (command.kind === "upload") {
    const bytes = await readFile(command.file);
    result = await client.send(
      uploadImageBytes({
        image: new Uint8Array(bytes),
        filename: basename(command.file),
        accessPolicy: command.accessPolicy,
        title: command.title,
        desc: command.desc,
      }),
    );
  } else if (command.kind === "delete") {
    result = await client.send(deleteImage({ imageId: command.imageId }));
  } else if (command.kind === "search") {
    if (command.page !== undefined && command.perPage !== undefined) {
      result = await client.send(
        searchImages({
          query: command.query,
          page: command.page,
          perPage: command.perPage,
        }),
      );
    } else if (command.page !== undefined) {
      result = await client.send(
        searchImages({ query: command.query, page: command.page }),
      );
    } else if (command.perPage !== undefined) {
      result = await client.send(
        searchImages({ query: command.query, perPage: command.perPage }),
      );
    } else {
      result = await client.send(searchImages({ query: command.query }));
    }
  } else if (command.kind === "me") {
    result = await client.send(getCurrentUser());
  } else {
    result = await client.send(getOEmbed({ url: command.url }));
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

  process.stderr.write(`Delete image ${command.imageId}? [y/N] `);
  const buffer = Buffer.alloc(16);
  const length = readSync(0, buffer, 0, buffer.length, null);
  const answer = buffer.toString("utf8", 0, length).trim().toLowerCase();
  if (answer === "y" || answer === "yes") return true;
  process.stderr.write("Cancelled.\n");
  return false;
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    process.stderr.write(`gyazoctl: ${error.message}\n`);
  } else {
    process.stderr.write(`gyazoctl: ${String(error)}\n`);
  }
  process.stderr.write("Run 'gyazoctl --help' for usage.\n");
  process.exit(1);
});
