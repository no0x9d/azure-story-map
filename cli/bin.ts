#!/usr/bin/env node

import yargs from "yargs";
import { createConnection } from "../src/azure-connection.js";
import {
  generateDotGraph,
  generateSvg,
  getDependencies,
} from "../src/storymap.js";

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
          description: "output format of the graph as svg or Graphviz dot",
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
          description: "controls how edges are drawn",
          choices: ["ortho", "polyline", "line", "spline", "curved"],
          default: "ortho",
        }),
    async ({ org, pat, query, format, direction, splines }) => {
      const awaitedQuery = await query;

      const connection = createConnection(org, pat);
      try {
        const dependencies = await getDependencies({
          connection,
          query: awaitedQuery,
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
      } catch (e: unknown) {
        console.error(e instanceof Error ? e.message : "Error occurred");
      }
    },
  )
  .demandCommand()
  .help()
  .parse();

async function argIsString(value: string): Promise<string> {
  if (!process.stdin.isTTY && value === "-") {
    value = await readFromStdin();
  }

  return value;
}

function readFromStdin(): Promise<string> {
  return new Promise<string>((resolve) => {
    const stdin = process.stdin;
    const inputChunks: string[] = [];
    stdin.resume();
    stdin.setEncoding("utf8");

    stdin.on("data", function (chunk) {
      inputChunks.push(chunk.toString());
    });

    stdin.on("end", function () {
      const inputJSON = inputChunks.join("");
      resolve(inputJSON);
    });
  });
}
