"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthClient_1 = require("./AuthClient");
class TicketManager {
    constructor(options) {
        /// Private Methods
        this._validateTicket = (authTicket) => {
            if (!authTicket.accessToken ||
                !authTicket.refreshToken ||
                !authTicket.jwtAccessToken)
                throw new Error('Invalid auth ticket!');
        };
        this._performTicketFetch = async () => {
            var _a;
            if (!((_a = this._storageManager) === null || _a === void 0 ? void 0 : _a.ticketFetcher))
                return Promise.reject('No implementation for ticketFetcher provided.');
            if (!this._authClient)
                return Promise.reject('No implementation for AuthClient provided.');
            if (this._ticketFetcherPromise)
                return this._ticketFetcherPromise;
            this._ticketFetcherPromise = this._storageManager.ticketFetcher(this._authClient);
            return this._ticketFetcherPromise.then(resp => {
                this._ticketFetcherPromise = undefined;
                return resp;
            }).catch(err => {
                this._ticketFetcherPromise = undefined;
                throw err;
            });
        };
        this._performTicketRefresh = async (authTicket) => {
            if (!this._authClient)
                return Promise.reject('No implementation for AuthClient provided.');
            if (this._ticketRefreshPromise)
                return this._ticketRefreshPromise;
            this._ticketRefreshPromise = this._authClient.refreshUserAuth(authTicket);
            return this._ticketRefreshPromise.catch(err => {
                throw err;
            }).finally(() => {
                this._ticketRefreshPromise = undefined;
            });
        };
        this._refreshTicket = async (authTicket) => {
            if (!this._authClient)
                return Promise.reject('No implementation for AuthClient provided.');
            let newTicketPromise;
            if (authTicket !== null && authTicket !== undefined) {
                if (authTicket.refreshToken && new Date() < authTicket.refreshTokenExpiration) {
                    newTicketPromise = this._performTicketRefresh(authTicket);
                }
                else {
                    newTicketPromise = this._performTicketFetch();
                }
            }
            else {
                newTicketPromise = this._performTicketFetch();
            }
            return newTicketPromise.then(ticket => {
                var _a;
                if ((_a = this._storageManager) === null || _a === void 0 ? void 0 : _a.onTicketRefreshed)
                    this._storageManager.onTicketRefreshed(ticket);
                return this.setTicket(ticket);
            });
        };
        /// Public Methods
        this.setTicket = authTicket => {
            var _a, _b;
            this._validateTicket(authTicket);
            this._authTicket = AuthClient_1.formatTicket(authTicket);
            (_b = (_a = this._storageManager) === null || _a === void 0 ? void 0 : _a.onTicketChanged) === null || _b === void 0 ? void 0 : _b.call(_a, authTicket);
            return authTicket;
        };
        this.getTicket = async () => {
            if (this._authTicket && !TicketManager.isTicketExpired(this._authTicket))
                return Promise.resolve(this._authTicket);
            return this._refreshTicket(this._authTicket);
        };
        this.getToken = async () => {
            return this.getTicket().then(ticket => {
                return ticket.accessToken || '';
            });
        };
        this.invalidateTicket = () => {
            this._authTicket = undefined;
            this._storageManager.onTicketRemoved();
        };
        this._authClient = options.authClient;
        this._storageManager = options.storageManager;
        if (options.ticket)
            this._authTicket = AuthClient_1.formatTicket(options.ticket);
    }
}
exports.default = TicketManager;
/// Static Methods
TicketManager.isTicketExpired = (authTicket) => {
    return !authTicket || !authTicket.accessToken || !authTicket.accessTokenExpiration || new Date() > authTicket.accessTokenExpiration;
};
//# sourceMappingURL=TicketManager.js.map