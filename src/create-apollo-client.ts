import { ApolloLink, concat } from "apollo-link";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import fetch from "isomorphic-fetch";
import { ApiAuthCache } from "./lib/api-auth-cache";
import { APIAuthClient } from "./lib/api-auth-client";
import { ShopperAuthClient } from "./lib/shopper-auth-client";
import { ShopperAuthManager } from "./lib/shopper-auth-handler";
import { getHostFromUrl, isValidConfig, getApiConfigFromEnv } from "./lib/util";
import {
  getAPIAuthLink,
  getHttpLink,
  getOnErrorLink,
  getShopperAuthLink,
} from "./lib/apollo-links";

import type {
  AuthHooks,
  KiboApolloClient,
  KiboApolloClientConfig,
} from "./types";

const apiAuthTicketCache = new ApiAuthCache("API_AUTH");

export function CreateApolloClient(config?: KiboApolloClientConfig): any {
  config = config || { api: getApiConfigFromEnv() }
  if(!isValidConfig(config)){
    throw new Error("Invalid API config provided to Kibo CreateApolloClient");
  }
  const { api: apiConfig } = config;
  // if no auth host provided, try to get from access token url
  if (!apiConfig.authHost && apiConfig.accessTokenUrl) {
    apiConfig.authHost = getHostFromUrl(apiConfig.accessTokenUrl);
  }
  const apiAuthClient = new APIAuthClient(apiConfig, fetch, apiAuthTicketCache);

  // only initialize shopper auth managers if client auth hooks provided
  const clientAuthHooks: AuthHooks | undefined = config?.clientAuthHooks;
  let userAuthClient, shopperAuthManager;
  if (clientAuthHooks) {
    userAuthClient = new ShopperAuthClient(apiConfig, fetch, apiAuthClient);
    shopperAuthManager = new ShopperAuthManager(
      userAuthClient,
      clientAuthHooks
    );
  }
  const { apiHost } = apiConfig;
  const client = new ApolloClient({
    link: ApolloLink.from([
      getOnErrorLink(),
      getAPIAuthLink(apiAuthClient),
      shopperAuthManager
        ? concat(getShopperAuthLink(shopperAuthManager), getHttpLink(apiHost))
        : getHttpLink(apiHost),
    ]),
    cache: new InMemoryCache({ addTypename: false }),
  });
  (client as KiboApolloClient).isValidConfig = isValidConfig;
  (client as KiboApolloClient).apiAuthClient = apiAuthClient;
  (client as KiboApolloClient).shopperAuthClient = userAuthClient;
  (client as KiboApolloClient).shopperAuthManager = shopperAuthManager;

  return client;
}
