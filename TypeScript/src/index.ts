import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { ApolloLink } from 'apollo-link';
import { RetryLink } from 'apollo-link-retry';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import AuthClient, { UserAuthTicket } from './lib/AuthClient';
import TicketManager from './lib/TicketManager';
import fetch from 'isomorphic-fetch';
import httpProxy from 'http-proxy-agent';
import httpsProxy from 'https-proxy-agent';

export interface KiboApolloApiConfig {
  accessTokenUrl: string;
  clientId: string;
  sharedSecret: string;
  apiHost: string;
}

export interface KiboApolloClientConfig {
  api: KiboApolloApiConfig;
  clientAuthHooks: {
    onTicketChange: (authTicket: UserAuthTicket) => void;
    onTicketRead: () => UserAuthTicket;
    onTicketRemove: () => void;
  };
}

export interface KiboApolloClient extends ApolloClient<any> {
  authClient: AuthClient;
  ticketManager: TicketManager;
  isValidConfig: (config: KiboApolloClientConfig) => boolean;
}

export interface BeforeAuthArgs {
  authClient: AuthClient;
  ticketManager: TicketManager;
  apolloReq: any;
  currentTicket?: UserAuthTicket;
}


const handleBeforeAuth: (arg: BeforeAuthArgs) => Promise<UserAuthTicket> = async ({ authClient, ticketManager, apolloReq, currentTicket }) => {
  if (!currentTicket) {
    const ticket = await authClient.anonymousAuth();
    ticketManager.setTicket(ticket);
    currentTicket = ticket;
    return ticket;
  }
  return await ticketManager.getTicket();
}

const handleRetry: (obj: { ticketManager: TicketManager}) => (count: number, operation: any, error: any) => Promise<boolean> = ({ ticketManager }) => async (count, _, error) => {
  if (count > 3) {
    return false;
  }

  if (error?.result?.message === 'invalid_token') {
    // Logger.debug(`Apollo retry-link, the operation (${operation.operationName}) sent with wrong token, creating a new one... (attempt: ${count})`);
    await ticketManager.getTicket();
    return true;
  }

  return false;
}

const isValidConfig: (config: KiboApolloClientConfig) => boolean = config => {
  if (!config ||
    !config.api ||
    !config.api.accessTokenUrl ||
    !config.api.apiHost ||
    !config.api.clientId ||
    !config.api.sharedSecret) return false;
  return true;
}

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function CreateApolloClient(config: KiboApolloClientConfig): KiboApolloClient {
  let currentTicket: UserAuthTicket | undefined = config.clientAuthHooks.onTicketRead();

  const authClient = new AuthClient(config.api);
  
  const ticketManager = new TicketManager({
    authClient,
    ticket: currentTicket,
    storageManager: {
      ticketFetcher: (authClient) => authClient.anonymousAuth(),
      onTicketChanged: (authTicket) => {
        config.clientAuthHooks.onTicketChange(authTicket);
        currentTicket = authTicket;
      },
      onTicketRefreshed: (authTicket) => {
        config.clientAuthHooks.onTicketChange(authTicket);
        currentTicket = authTicket;
      },
      onTicketRemoved: () => {
        config.clientAuthHooks.onTicketRemove();
        currentTicket = undefined;
      }
    }
  });

  const errorHandlerLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) => {
        if (!message.includes('Resource Owner Password Credentials Grant')) {
          if (!locations) {
            console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`);
            return;
          }

          const parsedLocations = locations.map(({ column, line }) => `[column: ${column}, line: ${line}]`);

          console.error(`[GraphQL error]: Message: ${message}, Location: ${parsedLocations.join(', ')}, Path: ${path}`);
        }
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  const errorRetry = new RetryLink({
    attempts: handleRetry({ ticketManager }),
    delay: () => 0
  });
  
  const authLinkBefore: ApolloLink = setContext(async (apolloReq, { headers }) => {
    currentTicket = await handleBeforeAuth({ authClient, ticketManager, apolloReq, currentTicket });
    const appToken = await authClient.getAppAuthToken();

    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${appToken}`,
        'x-vol-user-claims': currentTicket?.accessToken
      }
    }
  });

  const httpLink = createHttpLink({
    uri: config.api.apiHost + '/graphql',
    fetch: (uri, options) => {
      options = {
        ...options,
        credentials: 'include'
      };
      if ("HTTP_PROXY" in process.env && uri.toString().indexOf('http:') === 0) {
        if (process.env.HTTP_PROXY?.match(urlRegex)) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
          const response = fetch(uri, {
            ...options,
            agent: new httpProxy.HttpProxyAgent(process.env.HTTP_PROXY as string)
          } as any)
          return response;
        }
      }
      if ("HTTPS_PROXY" in process.env && uri.toString().indexOf('https:') === 0) {
        if (process.env.HTTPS_PROXY?.match(urlRegex)) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
          const response = fetch(uri, {
            ...options,
            agent: new httpsProxy.HttpsProxyAgent(process.env.HTTPS_PROXY as string)
          } as any)
          return response;
        }
      }
      return fetch(uri, options);
    }
  });

  const client = new ApolloClient({
    link: ApolloLink.from([errorHandlerLink, errorRetry, authLinkBefore.concat(httpLink)]),
    cache: new InMemoryCache()
  });

  (client as KiboApolloClient).isValidConfig = isValidConfig;
  (client as KiboApolloClient).authClient = authClient;
  (client as KiboApolloClient).ticketManager = ticketManager;

  return client as KiboApolloClient;
}