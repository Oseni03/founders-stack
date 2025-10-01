/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CommonDataModel {
	id: string;
	type: string;
	attributes: Record<string, any>;
	relationships?: Record<string, any>;
	metadata: {
		source: string;
		fetchedAt: Date;
		rawData?: any;
	};
}

export abstract class BaseConnector {
	constructor(
		protected accessToken: string,
		protected refreshToken?: string
	) {}

	// Core method: fetch data from the external API
	abstract fetchData(
		endpoint: string,
		params?: Record<string, any>
	): Promise<any>;

	// Transform their data to your format
	abstract normalizeToCDM(rawData: any, dataType: string): CommonDataModel[];

	// Check if tokens are still valid
	abstract validateCredentials(): Promise<boolean>;

	// Helper for API calls
	protected async makeRequest(url: string, method = "GET", body?: any) {
		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				"Content-Type": "application/json",
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		return response.json();
	}
}
