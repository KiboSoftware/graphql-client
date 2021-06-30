import { UserAuthTicket } from './AuthClient';
import AuthClient from './AuthClient';
export interface TicketStorageManager {
    ticketFetcher: (client: AuthClient) => Promise<UserAuthTicket>;
    onTicketChanged: (ticket: UserAuthTicket) => void;
    onTicketRefreshed: (ticket: UserAuthTicket) => void;
    onTicketRemoved: () => void;
}
export interface TicketManagerOptions {
    authClient: AuthClient;
    storageManager: TicketStorageManager;
    ticket?: UserAuthTicket;
}
export default class TicketManager {
    private _authClient;
    private _authTicket;
    private _storageManager;
    private _ticketFetcherPromise;
    private _ticketRefreshPromise;
    constructor(options: TicketManagerOptions);
    private _validateTicket;
    private _performTicketFetch;
    private _performTicketRefresh;
    private _refreshTicket;
    setTicket: (authTicket: UserAuthTicket) => UserAuthTicket;
    getTicket: () => Promise<UserAuthTicket>;
    getToken: () => Promise<string>;
    invalidateTicket: () => void;
    static isTicketExpired: (authTicket: UserAuthTicket) => boolean;
}
//# sourceMappingURL=TicketManager.d.ts.map