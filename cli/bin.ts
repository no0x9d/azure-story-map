#!/usr/bin/env node

import yargs from "yargs";
import { createConnection } from "../src/azure-connection.js";
import {
  generateDotGraph,
  generateSvg,
  getDependencies,
} from "../src/storymap.js";
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
      args
        .option("query", {
          alias: "q",
          description: "wiql query for all stories",
          type: "string",
          coerce: argIsString,
          requiresArg: true,
          demandOption: true,
        })
        .option("format", {
          alias: "f",
          description: "output format of the graph",
          choices: ["svg", "dot"],
          type: "string",
          default: "svg",
        })
        .option("direction", {
          alias: "d",
          description: "direction of the graph layout",
          choices: ["lr", "tb"],
          type: "string",
          default: "lr",
        })
        .option("splines", {
          alias: "s",
          description: "",
          choices: ["ortho", "polyline", "line", "spline", "curved"],
          default: "ortho",
        }),
    async ({ org, pat, query, format, direction, splines }) => {
      assert.ok(query);

      const connection = createConnection(org, pat);
      const dependencies = await getDependencies({
        connection,
        query,
      });
      const dotGraph = generateDotGraph({
        ...dependencies,
        direction,
        splines,
      });

      switch (format) {
        case "svg":
          const svgGraph = await generateSvg(dotGraph);
          console.log(svgGraph);
          break;
        case "dot":
          console.log(dotGraph);
      }
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
