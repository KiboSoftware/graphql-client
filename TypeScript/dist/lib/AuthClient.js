"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const jwt_decode_1 = __importDefault(require("jwt-decode"));
class AuthClient {
    constructor(config) {
        this._authClientTicket = null;
        this._reauth = false;
        this._ensureAuthTicket = async () => {
            if (!this._authClientTicket || this._authClientTicket.expires_at === null || this._authClientTicket.expires_at < new Date() && this._config) {
                const appTokenPostData = {
                    client_id: this._config.clientId,
                    client_secret: this._config.sharedSecret,
                    grant_type: 'client_credentials'
                };
                const authResponse = await isomorphic_fetch_1.default(this._config.accessTokenUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appTokenPostData)
                }).then(resp => resp.json());
                authResponse.expires_at = new Date();
                authResponse.expires_at.setSeconds(authResponse.expires_at.getSeconds() + authResponse.expires_in);
                this._authClientTicket = authResponse;
            }
        };
        this._formatTicket = (auth) => {
            auth.accessTokenExpiration = new Date(auth.accessTokenExpiration);
            auth.refreshTokenExpiration = new Date(auth.refreshTokenExpiration);
            if (auth.jwtAccessToken && typeof auth.jwtAccessToken === "string") {
                auth.parsedJWT = jwt_decode_1.default(auth.jwtAccessToken);
            }
            return auth;
        };
        this._executeRequest = async (url, method, body) => {
            var _a;
            await this._ensureAuthTicket();
            const options = {
                headers: {
                    'Authorization': `Bearer ${(_a = this._authClientTicket) === null || _a === void 0 ? void 0 : _a.access_token}`,
                    'Content-Type': 'application/json'
                },
                method,
                body
            };
            const resp = await isomorphic_fetch_1.default(url, options);
            if (!resp.ok && resp.status === 401 && !this._reauth) {
                this._reauth = true;
                await this._ensureAuthTicket();
                return this._executeRequest(url, method, body);
            }
            this._reauth = false;
            return this._formatTicket(await resp.json());
        };
        this.anonymousAuth = () => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets/anonymousshopper`, 'GET');
        this.customerPasswordAuth = (request) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets`, 'POST', request);
        this.refreshUserAuth = async ({ refreshToken }) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets/refresh/?refreshToken=${refreshToken}`, 'PUT');
        this._config = config;
    }
}
exports.default = AuthClient;
//# sourceMappingURL=AuthClient.js.map