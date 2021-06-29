"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const http_proxy_agent_1 = __importDefault(require("http-proxy-agent"));
const https_proxy_agent_1 = __importDefault(require("https-proxy-agent"));
const node_cache_1 = __importDefault(require("node-cache"));
const myCache = new node_cache_1.default();
;
const addProxy = (options, atUrl) => {
    if ("HTTP_PROXY" in process.env && atUrl.indexOf('http:') === 0) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        options.agent = new http_proxy_agent_1.default.HttpProxyAgent(process.env.HTTP_PROXY);
    }
    else if ("HTTPS_PROXY" in process.env && atUrl.indexOf('https:') === 0) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        options.agent = new https_proxy_agent_1.default.HttpsProxyAgent(process.env.HTTPS_PROXY);
    }
    return options;
};
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
                let authOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appTokenPostData)
                };
                addProxy(authOptions, this._config.accessTokenUrl.toString());
                const authResponse = await isomorphic_fetch_1.default(this._config.accessTokenUrl, authOptions).then(resp => resp.json());
                authResponse.expires_at = new Date();
                authResponse.expires_at.setSeconds(authResponse.expires_at.getSeconds() + authResponse.expires_in);
                this._authClientTicket = authResponse;
                myCache.set("authClientTicket", authResponse);
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
        this._executeRequest = async (url, method, body, userToken) => {
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
            if (userToken) {
                options.headers['x-vol-user-claims'] = userToken;
            }
            addProxy(options, this._config.accessTokenUrl.toString());
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
        this.customerPasswordAuth = (request, ticket) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets`, 'POST', request, ticket === null || ticket === void 0 ? void 0 : ticket.accessToken);
        this.refreshUserAuth = async ({ refreshToken, accessToken }) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets/refresh/?refreshToken=${refreshToken}`, 'PUT', undefined, accessToken);
        this.getAppAuthToken = async () => {
            await this._ensureAuthTicket();
            if (this._authClientTicket !== undefined && this._authClientTicket !== null && this._authClientTicket.access_token !== null)
                return this._authClientTicket.access_token;
            return '';
        };
        this._config = config;
        const authTicket = myCache.get("authClientTicket");
        if (authTicket) {
            this._authClientTicket = authTicket;
        }
    }
}
exports.default = AuthClient;
//# sourceMappingURL=AuthClient.js.map