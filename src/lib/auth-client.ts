/** @format */

import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
	// auth client will be used to interact with the auth server
	baseURL: process.env.BETTER_AUTH_URL,
});
