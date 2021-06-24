"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateApolloClient = void 0;
const apollo_link_http_1 = require("apollo-link-http");
const apollo_link_context_1 = require("apollo-link-context");
const apollo_link_1 = require("apollo-link");
const apollo_link_retry_1 = require("apollo-link-retry");
const apollo_client_1 = require("apollo-client");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const apollo_link_error_1 = require("apollo-link-error");
const AuthClient_1 = __importDefault(require("./lib/AuthClient"));
const TicketManager_1 = __importDefault(require("./lib/TicketManager"));
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const http_proxy_agent_1 = __importDefault(require("http-proxy-agent"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const handleBeforeAuth = async ({ authClient, ticketManager, apolloReq, currentTicket }) => {
    if (!currentTicket) {
        const ticket = await authClient.anonymousAuth();
        ticketManager.setTicket(ticket);
        currentTicket = ticket;
        return ticket.accessToken;
    }
    return (await ticketManager.getTicket()).accessToken;
};
const handleRetry = ({ ticketManager }) => async (count, _, error) => {
    var _a;
    if (count > 3) {
        return false;
    }
    if (((_a = error === null || error === void 0 ? void 0 : error.result) === null || _a === void 0 ? void 0 : _a.message) === 'invalid_token') {
        // Logger.debug(`Apollo retry-link, the operation (${operation.operationName}) sent with wrong token, creating a new one... (attempt: ${count})`);
        await ticketManager.getTicket();
        return true;
    }
    return false;
};
const isValidConfig = config => {
    if (!config ||
        !config.api ||
        !config.api.accessTokenUrl ||
        !config.api.apiHost ||
        !config.api.clientId ||
        !config.api.sharedSecret)
        return false;
    return true;
};
function CreateApolloClient(config) {
    let currentTicket = config.clientAuthHooks.onTicketRead();
    const authClient = new AuthClient_1.default(config.api);
    const ticketManager = new TicketManager_1.default({
        authClient,
        ticket: currentTicket,
        storageManager: {
            ticketFetcher: (authClient) => authClient.anonymousAuth(),
            onTicketChanged: (authTicket) => {
                config.clientAuthHooks.onTicketChange(authTicket);
            },
            onTicketRefreshed: (authTicket) => {
                config.clientAuthHooks.onTicketChange(authTicket);
            }
        }
    });
    const errorHandlerLink = apollo_link_error_1.onError(({ graphQLErrors, networkError }) => {
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
    const errorRetry = new apollo_link_retry_1.RetryLink({
        attempts: handleRetry({ ticketManager }),
        delay: () => 0
    });
    const authLinkBefore = apollo_link_context_1.setContext(async (apolloReq, { headers }) => {
        currentTicket = config.clientAuthHooks.onTicketRead();
        const userToken = await handleBeforeAuth({ authClient, ticketManager, apolloReq, currentTicket });
        const appToken = await authClient.getAppAuthToken();
        return {
            headers: Object.assign(Object.assign({}, headers), { Authorization: `Bearer ${appToken}`, 'x-vol-user-claims': userToken })
        };
    });
    const httpLink = apollo_link_http_1.createHttpLink({
        uri: config.api.apiHost + '/graphql',
        fetch: (uri, options) => {
            if ("HTTP_PROXY" in process.env && uri.toString().indexOf('http:') === 0) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                const response = isomorphic_fetch_1.default(uri, Object.assign(Object.assign({}, options), { agent: new http_proxy_agent_1.default.HttpProxyAgent(process.env.HTTP_PROXY) }));
                return response;
            }
            if ("HTTPS_PROXY" in process.env && uri.toString().indexOf('https:') === 0) {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                const response = isomorphic_fetch_1.default(uri, Object.assign(Object.assign({}, options), { agent: new https_proxy_agent_1.default.HttpsProxyAgent(process.env.HTTPS_PROXY) }));
                return response;
            }
            return isomorphic_fetch_1.default(uri, options);
        }
    });
    const client = new apollo_client_1.ApolloClient({
        link: apollo_link_1.ApolloLink.from([errorHandlerLink, errorRetry, authLinkBefore.concat(httpLink)]),
        cache: new apollo_cache_inmemory_1.InMemoryCache()
    });
    client.isValidConfig = isValidConfig;
    client.authClient = authClient;
    client.ticketManager = ticketManager;
    return client;
}
exports.CreateApolloClient = CreateApolloClient;
//# sourceMappingURL=index.js.map