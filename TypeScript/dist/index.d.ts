import { ApolloClient } from 'apollo-client';
import AuthClient, { UserAuthTicket } from './lib/AuthClient';
import TicketManager from './lib/TicketManager';
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
    currentTicket: UserAuthTicket;
}
export declare function CreateApolloClient(config: KiboApolloClientConfig): KiboApolloClient;
//# sourceMappingURL=index.d.ts.map