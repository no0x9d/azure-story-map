import * as azure from 'azure-devops-node-api';
import { secrets } from 'bun';

const SERVICE_NAME = 'noOx9d/azure-story-map';

export async function createConnection(orgUrl: string, token: string) {
	const authHandler = azure.getPersonalAccessTokenHandler(token);
	return new azure.WebApi(orgUrl, authHandler);
}

export async function persistCredentials(orgUrl: string, token: string) {
	await secrets.set({
		service: SERVICE_NAME,
		name: 'azure-base-url',
		value: orgUrl
	});
	await secrets.set({
		service: SERVICE_NAME,
		name: 'azure-token',
		value: token
	});
}

export async function getCredentials() {
	const orgUrl = await secrets.get({
		service: SERVICE_NAME,
		name: 'azure-base-url'
	});
	const token = await secrets.get({
		service: SERVICE_NAME,
		name: 'azure-token'
	});
	if (!orgUrl || !token) {
		return null;
	}
	return { orgUrl, token };
}
