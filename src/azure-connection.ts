import * as azure from "azure-devops-node-api";

export function createConnection(orgUrl: string, token: string) {
  const authHandler = azure.getPersonalAccessTokenHandler(token);
  return new azure.WebApi(orgUrl, authHandler);
}
