import { parseArgs } from "node:util";

export type CommandName =
  | "delete"
  | "get"
  | "list"
  | "me"
  | "oembed"
  | "search"
  | "upload";

export type CliCommand =
  | Readonly<{ kind: "help"; command?: CommandName }>
  | Readonly<{ kind: "version" }>
  | Readonly<{ kind: "list"; page?: number; perPage?: number }>
  | Readonly<{ kind: "get"; imageId: string }>
  | Readonly<{
      kind: "upload";
      file: string;
      accessPolicy?: string;
      title?: string;
      desc?: string;
    }>
  | Readonly<{ kind: "delete"; imageId: string; yes: boolean }>
  | Readonly<{ kind: "search"; query: string; page?: number; perPage?: number }>
  | Readonly<{ kind: "me" }>
  | Readonly<{ kind: "oembed"; url: string }>;

const commandNames = new Set<CommandName>([
  "delete",
  "get",
  "list",
  "me",
  "oembed",
  "search",
  "upload",
]);

export function parseCli(args: ReadonlyArray<string>): CliCommand {
  const first = args[0];
  if (first === undefined) return { kind: "help" };
  if (first === "help") {
    const command = args[1];
    if (args.length > 2 || (command !== undefined && !isCommandName(command))) {
      throw new TypeError("Usage: gyazoctl help [command]");
    }
    return command === undefined ? { kind: "help" } : { kind: "help", command };
  }

  if (args.includes("-h") || args.includes("--help")) {
    return isCommandName(first)
      ? { kind: "help", command: first }
      : { kind: "help" };
  }
  if (first === "--version") return { kind: "version" };
  if (!isCommandName(first)) {
    throw new TypeError(`Unknown command: ${first}`);
  }

  const rest = args.slice(1);
  switch (first) {
    case "list": {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          page: { type: "string" },
          "per-page": { type: "string" },
        },
        allowPositionals: true,
      });
      none(positionals, "gyazoctl list [--page N] [--per-page N]");
      const page = integer(values.page, "--page");
      const perPage = integer(values["per-page"], "--per-page");
      return {
        kind: "list",
        ...(page === undefined ? {} : { page }),
        ...(perPage === undefined ? {} : { perPage }),
      };
    }
    case "get": {
      const { positionals } = parseArgs({
        args: [...rest],
        allowPositionals: true,
      });
      return {
        kind: "get",
        imageId: one(positionals, "gyazoctl get IMAGE_ID"),
      };
    }
    case "upload": {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          "access-policy": { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
        allowPositionals: true,
      });
      return {
        kind: "upload",
        file: one(positionals, "gyazoctl upload FILE [options]"),
        ...(values["access-policy"] === undefined
          ? {}
          : { accessPolicy: values["access-policy"] }),
        ...(values.title === undefined ? {} : { title: values.title }),
        ...(values.description === undefined
          ? {}
          : { desc: values.description }),
      };
    }
    case "delete": {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: { yes: { type: "boolean", short: "y" } },
        allowPositionals: true,
      });
      return {
        kind: "delete",
        imageId: one(positionals, "gyazoctl delete IMAGE_ID [--yes]"),
        yes: values.yes ?? false,
      };
    }
    case "search": {
      const { values, positionals } = parseArgs({
        args: [...rest],
        options: {
          page: { type: "string" },
          "per-page": { type: "string" },
        },
        allowPositionals: true,
      });
      const page = integer(values.page, "--page");
      const perPage = integer(values["per-page"], "--per-page");
      return {
        kind: "search",
        query: one(positionals, "gyazoctl search QUERY [options]"),
        ...(page === undefined ? {} : { page }),
        ...(perPage === undefined ? {} : { perPage }),
      };
    }
    case "me": {
      const { positionals } = parseArgs({
        args: [...rest],
        allowPositionals: true,
      });
      none(positionals, "gyazoctl me");
      return { kind: "me" };
    }
    case "oembed": {
      const { positionals } = parseArgs({
        args: [...rest],
        allowPositionals: true,
      });
      return { kind: "oembed", url: one(positionals, "gyazoctl oembed URL") };
    }
  }
}

export function helpText(command?: CommandName): string {
  if (command) return commandHelp[command];
  return `gyazoctl - Gyazo API command-line client

Examples:
  gyazoctl list --per-page 20
  gyazoctl upload screenshot.png --title "Screenshot"
  gyazoctl search "architecture diagram"

Usage:
  gyazoctl <command> [options]

Commands:
  list       List images
  get        Get an image
  upload     Upload an image
  delete     Delete an image
  search     Search images (Gyazo Pro)
  me         Get the current user
  oembed     Get oEmbed data

Options:
  -h, --help  Show help
  --version   Show version

Environment:
  GYAZO_ACCESS_TOKEN  Gyazo API access token

Run 'gyazoctl <command> --help' for command details.
Report issues: https://github.com/mktbsh/gyazo-api-sdk/issues`;
}

const commandHelp: Readonly<Record<CommandName, string>> = {
  list: `List images.

Usage:
  gyazoctl list [--page N] [--per-page N]`,
  get: `Get an image.

Usage:
  gyazoctl get IMAGE_ID`,
  upload: `Upload an image.

Usage:
  gyazoctl upload FILE [options]

Options:
  --access-policy POLICY  anyone or only_me
  --title TITLE
  --description TEXT`,
  delete: `Delete an image.

Usage:
  gyazoctl delete IMAGE_ID [--yes]

Options:
  -y, --yes  Skip the confirmation prompt`,
  search: `Search images. Gyazo Pro is required.

Usage:
  gyazoctl search QUERY [--page N] [--per-page N]`,
  me: `Get the current user.

Usage:
  gyazoctl me`,
  oembed: `Get oEmbed data.

Usage:
  gyazoctl oembed URL`,
};

function isCommandName(value: string): value is CommandName {
  return commandNames.has(value as CommandName);
}

function one(positionals: ReadonlyArray<string>, usage: string): string {
  if (positionals.length !== 1) throw new TypeError(`Usage: ${usage}`);
  return positionals[0] as string;
}

function none(positionals: ReadonlyArray<string>, usage: string): void {
  if (positionals.length !== 0) throw new TypeError(`Usage: ${usage}`);
}

function integer(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new TypeError(`${name} must be an integer`);
  return Number(value);
}
