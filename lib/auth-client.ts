// If you want to sign in or out from the client side
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", //the base url off auth server
});
