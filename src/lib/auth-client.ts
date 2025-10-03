import {
	customSessionClient,
	organizationClient,
	magicLinkClient,
	genericOAuthClient,
} from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [
		organizationClient(),
		customSessionClient<typeof auth>(),
		polarClient(),
		magicLinkClient(),
		genericOAuthClient(),
	],
});
