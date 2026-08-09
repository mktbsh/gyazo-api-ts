export type CommandName =
  | "delete"
  | "get"
  | "list"
  | "me"
  | "oembed"
  | "search"
  | "upload";

export type CliCommand =
  | Readonly<{ kind: "help" }>
  | Readonly<{ kind: "help"; command: CommandName }>
  | Readonly<{ kind: "version" }>
  | Readonly<{
      kind: "list";
      page: number | undefined;
      perPage: number | undefined;
    }>
  | Readonly<{ kind: "get"; imageId: string }>
  | Readonly<{
      kind: "upload";
      file: string;
      accessPolicy: string | undefined;
      title: string | undefined;
      desc: string | undefined;
    }>
  | Readonly<{ kind: "delete"; imageId: string; yes: boolean }>
  | Readonly<{
      kind: "search";
      query: string;
      page: number | undefined;
      perPage: number | undefined;
    }>
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
    if (command === undefined) return { kind: "help" };
    return { kind: "help", command };
  }

  if (args.includes("-h") || args.includes("--help")) {
    if (isCommandName(first)) return { kind: "help", command: first };
    return { kind: "help" };
  }
  if (first === "--version") return { kind: "version" };
  if (!isCommandName(first)) {
    throw new TypeError(`Unknown command: ${first}`);
  }

  const rest = args.slice(1);
  if (first === "list") {
    const { page, perPage, positionals } = parsePagination(rest);
    none(positionals, "gyazoctl list [--page N] [--per-page N]");
    return { kind: "list", page, perPage };
  }
  if (first === "get") {
    return {
      kind: "get",
      imageId: one(noOptions(rest), "gyazoctl get IMAGE_ID"),
    };
  }
  if (first === "upload") {
    const { accessPolicy, desc, positionals, title } = parseUpload(rest);
    return {
      kind: "upload",
      file: one(positionals, "gyazoctl upload FILE [options]"),
      accessPolicy,
      title,
      desc,
    };
  }
  if (first === "delete") {
    const { positionals, yes } = parseDelete(rest);
    return {
      kind: "delete",
      imageId: one(positionals, "gyazoctl delete IMAGE_ID [--yes]"),
      yes,
    };
  }
  if (first === "search") {
    const { page, perPage, positionals } = parsePagination(rest);
    return {
      kind: "search",
      query: one(positionals, "gyazoctl search QUERY [options]"),
      page,
      perPage,
    };
  }
  if (first === "me") {
    const positionals = noOptions(rest);
    none(positionals, "gyazoctl me");
    return { kind: "me" };
  }
  const positionals = noOptions(rest);
  return { kind: "oembed", url: one(positionals, "gyazoctl oembed URL") };
}

function parsePagination(args: ReadonlyArray<string>): Readonly<{
  page: number | undefined;
  perPage: number | undefined;
  positionals: ReadonlyArray<string>;
}> {
  let page: number | undefined;
  let perPage: number | undefined;
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] as string;
    if (argument === "--page") {
      page = integer(optionValue(args, index, argument), argument);
      index += 1;
    } else if (argument === "--per-page") {
      perPage = integer(optionValue(args, index, argument), argument);
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new TypeError(`Unknown option: ${argument}`);
    } else {
      positionals.push(String(argument));
    }
  }
  return { page, perPage, positionals };
}

function parseUpload(args: ReadonlyArray<string>): Readonly<{
  accessPolicy: string | undefined;
  desc: string | undefined;
  positionals: ReadonlyArray<string>;
  title: string | undefined;
}> {
  let accessPolicy: string | undefined;
  let desc: string | undefined;
  let title: string | undefined;
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] as string;
    if (argument === "--access-policy") {
      accessPolicy = optionValue(args, index, argument);
      index += 1;
    } else if (argument === "--description") {
      desc = optionValue(args, index, argument);
      index += 1;
    } else if (argument === "--title") {
      title = optionValue(args, index, argument);
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new TypeError(`Unknown option: ${argument}`);
    } else {
      positionals.push(String(argument));
    }
  }
  return { accessPolicy, desc, positionals, title };
}

function parseDelete(args: ReadonlyArray<string>): Readonly<{
  positionals: ReadonlyArray<string>;
  yes: boolean;
}> {
  let yes = false;
  const positionals: string[] = [];
  for (const argument of args) {
    if (argument === "--yes" || argument === "-y") {
      yes = true;
    } else if (argument.startsWith("-")) {
      throw new TypeError(`Unknown option: ${argument}`);
    } else {
      positionals.push(String(argument));
    }
  }
  return { positionals, yes };
}

function noOptions(args: ReadonlyArray<string>): ReadonlyArray<string> {
  for (const argument of args) {
    if (argument.startsWith("-")) {
      throw new TypeError(`Unknown option: ${argument}`);
    }
  }
  return args;
}

function optionValue(
  args: ReadonlyArray<string>,
  index: number,
  option: string,
): string {
  const value = args[index + 1];
  if (value === undefined) throw new TypeError(`${option} requires a value`);
  return value;
}

export function helpText(command?: CommandName): string {
  if (command === "delete") return commandHelp.delete;
  if (command === "get") return commandHelp.get;
  if (command === "list") return commandHelp.list;
  if (command === "me") return commandHelp.me;
  if (command === "oembed") return commandHelp.oembed;
  if (command === "search") return commandHelp.search;
  if (command === "upload") return commandHelp.upload;
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
  return Number.parseInt(value, 10);
}
