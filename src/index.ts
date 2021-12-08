import { CreateApolloClient as CreateStandardApolloClient } from "./create-apollo-client";
import { CreateArcJSApolloClient } from "./create-arc-apollo-client";
import type { KiboApolloClientConfig } from "./types";

export function CreateApolloClient(config?: KiboApolloClientConfig | null) {
  const isKiboHosted = !!process.env.mozuHosted;
  if (isKiboHosted) {
    return CreateArcJSApolloClient();
  } else {
    return CreateStandardApolloClient(config as KiboApolloClientConfig);
  }
}
export * from "./types";
export { APIAuthClient } from "./lib/api-auth-client";
export { ShopperAuthClient } from "./lib/shopper-auth-client";
export * from 'graphql-tag'