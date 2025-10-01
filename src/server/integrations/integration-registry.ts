import { BaseConnector } from "./base-connector";

// src/server/integrations/integration-registry.ts
export class IntegrationRegistry {
	private static connectors = new Map<string, typeof BaseConnector>();

	// Register available integration types
	static register(name: string, connectorClass: typeof BaseConnector) {
		this.connectors.set(name, connectorClass);
	}

	// Create connector instance with tokens from BetterAuth
	static createConnector(
		integrationType: string,
		accessToken: string,
		refreshToken?: string
	): BaseConnector {
		const ConnectorClass = this.connectors.get(integrationType);
		if (!ConnectorClass) {
			throw new Error(`Unknown integration: ${integrationType}`);
		}
		return new ConnectorClass(accessToken, refreshToken);
	}

	static getAvailableIntegrations(): string[] {
		return Array.from(this.connectors.keys());
	}
}
