import { describe, expect, it } from "vitest";
import { helpText, parseCli } from "../src/cli";

describe("gyazoctl argument parser", () => {
  it("shows root and subcommand help from conventional forms", () => {
    expect(parseCli([])).toEqual({ kind: "help" });
    expect(parseCli(["--help"])).toEqual({ kind: "help" });
    expect(parseCli(["help", "upload"])).toEqual({
      kind: "help",
      command: "upload",
    });
    expect(parseCli(["search", "query", "-h"])).toEqual({
      kind: "help",
      command: "search",
    });
    expect(helpText()).toContain("GYAZO_ACCESS_TOKEN");
    expect(helpText("delete")).toContain("--yes");
  });

  it("parses read commands", () => {
    expect(parseCli(["list", "--page", "2", "--per-page", "10"])).toEqual({
      kind: "list",
      page: 2,
      perPage: 10,
    });
    expect(parseCli(["get", "abc123"])).toEqual({
      kind: "get",
      imageId: "abc123",
    });
    expect(parseCli(["search", "cat"])).toEqual({
      kind: "search",
      query: "cat",
      page: undefined,
      perPage: undefined,
    });
    expect(parseCli(["me"])).toEqual({ kind: "me" });
    expect(parseCli(["oembed", "https://gyazo.com/abc123"])).toEqual({
      kind: "oembed",
      url: "https://gyazo.com/abc123",
    });
  });

  it("parses upload and confirmed delete commands", () => {
    expect(
      parseCli([
        "upload",
        "image.png",
        "--access-policy",
        "only_me",
        "--title",
        "Title",
        "--description",
        "Description",
      ]),
    ).toEqual({
      kind: "upload",
      file: "image.png",
      accessPolicy: "only_me",
      title: "Title",
      desc: "Description",
    });
    expect(parseCli(["delete", "abc123", "-y"])).toEqual({
      kind: "delete",
      imageId: "abc123",
      yes: true,
    });
  });

  it("rejects unknown, malformed, and extra input", () => {
    expect(() => parseCli(["unknown"])).toThrow("Unknown command");
    expect(() => parseCli(["help", "unknown"])).toThrow("Usage");
    expect(() => parseCli(["list", "extra"])).toThrow("Usage");
    expect(() => parseCli(["get"])).toThrow("Usage");
    expect(() => parseCli(["me", "extra"])).toThrow("Usage");
    expect(() => parseCli(["list", "--page", "1.5"])).toThrow("integer");
  });

  it("parses version", () => {
    expect(parseCli(["--version"])).toEqual({ kind: "version" });
  });
});
