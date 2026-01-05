import * as azure from "azure-devops-node-api";
import assert from "node:assert";
import { env } from '$env/dynamic/private';

export function createConnection(orgUrl: string, token: string) {
  const authHandler = azure.getPersonalAccessTokenHandler(token);
  return new azure.WebApi(orgUrl, authHandler);
}

assert.ok(env.AZURE_BASE_URL, "AZURE_BASE_URL environment variable is not set");
assert.ok(
  env.AZURE_PERSONAL_ACCESS_TOKEN,
  "AZURE_PERSONAL_ACCESS_TOKEN environment variable is not set",
);

export const DEFAULT_CONNECTION = createConnection(env.AZURE_BASE_URL  ,env.AZURE_PERSONAL_ACCESS_TOKEN );
