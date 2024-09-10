#!/usr/bin/env node

import yargs from "yargs";
import { createConnection } from "../src/azure-connection.js";
import { getDependencies } from "../src/storymap.js";
import assert from "node:assert";

const rawArgs = process.argv.slice(2);

yargs(rawArgs)
  .scriptName("azsm")
  .usage("$0 <cmd> [args]")
  .option("org", {
    global: true,
    alias: "o",
    description: "https://dev.azure.com/<ORG>",
    default: process.env.AZURE_BASE_URL,
    defaultDescription: "env AZURE_BASE_URL",
    requiresArg: true,
    demandOption: true,
  })
  .option("pat", {
    global: true,
    alias: "P",
    description: "personal access token",
    default: process.env.AZURE_PERSONAL_ACCESS_TOKEN,
    defaultDescription: "env AZURE_PERSONAL_ACCESS_TOKEN",
    requiresArg: true,
    demandOption: true,
  })
  .command(
    "story-map",
    "create a story map for a query",
    (args) =>
      args.option("query", {
        alias: "q",
        description: "wiql query for all stories",
        type: "string",
        coerce: argIsString,
        requiresArg: true,
        demandOption: true,
      }),
    async ({ org, pat, query }) => {
      assert.ok(query);
      const connection = createConnection(org, pat);
      await getDependencies({
        connection,
        query,
      });
    },
  )
  .demandCommand()
  .help()
  .parse();

function argIsString(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  throw new Error("wiql query must be a string");
}
