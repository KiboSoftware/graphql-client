import { createHttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import type { RetryFunction } from "apollo-link-retry/lib/retryFunction";
import { setContext } from "apollo-link-context";
import { ApolloLink } from "apollo-link";
import { getKiboHostedConfig, getProxyAgent, makeKiboAPIHeaders } from "./util";
import type { APIAuthenticationFetcher } from "../types";

export function getHttpLink(apiHost: string) {
  return createHttpLink({
    uri: apiHost + "/graphql",
    fetch: (uri, options) => {
      options = {
        ...options,
        ...getProxyAgent(),
      };
      return fetch(uri, options);
    },
  });
}

export function getOnErrorLink() {
  return onError(({ graphQLErrors, networkError, operation }) => {
    const correlationId =
      operation.getContext()?.headers?.["x-vol-correlation"];

    if (graphQLErrors) {
      for (const graphQlError of graphQLErrors) {
        const { message, locations, path } = graphQlError;
        const parsedLocations = locations?.map(
          ({ column, line }) => `[column: ${column}, line: ${line}]`
        );
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${parsedLocations?.join(
            ", "
          )}, Path: ${path} Correlation ID: ${correlationId}`
        );
      }
    }
    if (networkError) {
      console.error(
        `[Network error]: ${networkError}, Correlation ID: ${correlationId}`
      );
    }
  });
}

export function retryHandler(ticketManager: any): RetryFunction {
  return async (count, operation, error) => {
    if (count > 3) {
      return false;
    }
    if (error?.result?.message === "invalid_token") {
      await ticketManager.getTicket();
      return true;
    }
    return false;
  };
}

export function getAPIAuthLink(
  authClient: APIAuthenticationFetcher
): ApolloLink {
  return setContext(async (apolloReq, { headers }) => {
    const apiAccessToken = await authClient.getAccessToken();
    return {
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        ...headers,
      },
    };
  });
}

export function getShopperAuthLink(shopperAuthClient: any): ApolloLink {
  return setContext(async (request, { headers }) => {
    const shopperAccessToken = await shopperAuthClient.getAccessToken();
    return {
      headers: {
        "x-vol-user-claims": shopperAccessToken,
        ...headers,
      },
    };
  });
}

export function getKiboHostedAuthLink(): ApolloLink {
  const config = getKiboHostedConfig();
  const kiboAPIHeaders = makeKiboAPIHeaders(config);
  return setContext(async (request, { headers }) => {
    return {
      headers: {
        ...kiboAPIHeaders,
        ...headers,
      },
    };
  });
}
