import { ApolloLink } from "apollo-link";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  getHttpLink,
  getOnErrorLink,
  getKiboHostedAuthLink,
} from "./lib/apollo-links";
import { getKiboHostedConfig } from "./lib/util";
export function CreateArcJSApolloClient() {
  const config = getKiboHostedConfig();
  const { baseUrl } = config;
  const client = new ApolloClient({
    link: ApolloLink.from([
      getOnErrorLink(),
      getKiboHostedAuthLink(),
      getHttpLink(baseUrl),
    ]),
    cache: new InMemoryCache({ addTypename: false }),
  });
  return client;
}
