import fetch from 'isomorphic-fetch';
import { KiboApolloApiConfig } from '..';
import httpProxy from 'http-proxy-agent';
import httpsProxy from 'https-proxy-agent';
import NodeCache from 'node-cache';

const myCache = new NodeCache();

export interface AppAuthTicket {
  access_token: string | null;
  token_type: string | null;
  expires_in: number;
  expires_at: Date | null;
  refresh_token: string | null;
}

export interface UserAuthTicket {
  accessToken: string;
  accessTokenExpiration: Date;
  refreshToken: string;
  refreshTokenExpiration: Date;
  userId?: string | null;
  jwtAccessToken?: string;
}

export interface FetchOptions {
  method: string;
  headers: {
    [x: string]: any;
  };
  body: string;
  agent?: any;
  [x: string]: any;
};

const addProxy = (options: FetchOptions, atUrl: string): FetchOptions => {
  if ("HTTP_PROXY" in process.env && atUrl.indexOf('http:') === 0) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    options.agent = new httpProxy.HttpProxyAgent(process.env.HTTP_PROXY as string);
  } else if ("HTTPS_PROXY" in process.env && atUrl.indexOf('https:') === 0) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    options.agent = new httpsProxy.HttpsProxyAgent(process.env.HTTPS_PROXY as string);
  }
  return options;
}

export default class AuthClient {
  private _authClientTicket: AppAuthTicket | null = null;
  private _reauth: boolean = false;
  private _config: KiboApolloApiConfig;

  private _ensureAuthTicket: () => Promise<void> = async () => {
    if (!this._authClientTicket || this._authClientTicket.expires_at === null || this._authClientTicket.expires_at < new Date() && this._config) {
      const appTokenPostData = {
        client_id: this._config.clientId,
        client_secret: this._config.sharedSecret,
        grant_type: 'client_credentials'
      };
      let authOptions: FetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appTokenPostData)
      };

      addProxy(authOptions, this._config.accessTokenUrl.toString());
      
      const authResponse = await fetch(this._config.accessTokenUrl, authOptions).then(resp => resp.json()) as AppAuthTicket;
      authResponse.expires_at = new Date();
      authResponse.expires_at.setSeconds(authResponse.expires_at.getSeconds() + authResponse.expires_in);
      this._authClientTicket = authResponse;
      myCache.set("authClientTicket", authResponse);
    }
  };

  private _executeRequest: (url: string, method: string, body?: any, userToken?: string) => Promise<any> = async (url, method, body, userToken) => {
    await this._ensureAuthTicket();
    const options: FetchOptions = {
      headers: {
        'Authorization': `Bearer ${this._authClientTicket?.access_token}`,
        'Content-Type': 'application/json'
      },
      method,
      body: body && typeof(body) === 'object' ? JSON.stringify(body) : body
    };
    if (userToken) {
      options.headers['x-vol-user-claims'] = userToken;
    }

    addProxy(options, this._config.accessTokenUrl.toString());

    const resp = await fetch(url, options);
  
    if (!resp.ok && resp.status === 401 && !this._reauth) {
      this._reauth = true;
      await this._ensureAuthTicket();
      return this._executeRequest(url, method, body);
    }
    this._reauth = false;
  
    return await resp.json();
  }

  constructor(config: KiboApolloApiConfig) {
    this._config = config;
    const authTicket = myCache.get<AppAuthTicket>("authClientTicket");
    if (authTicket) {
      this._authClientTicket = authTicket;
    }
  }

  anonymousAuth: () => Promise<UserAuthTicket> = () => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets/anonymousshopper`, 'GET'); 
  customerPasswordAuth: (request: { username: string; password: string; }, ticket?: UserAuthTicket) => Promise<UserAuthTicket> = (request, ticket) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets`, 'POST', request, ticket?.accessToken);
  refreshUserAuth: (ticket: UserAuthTicket) => Promise<UserAuthTicket> = async ({ refreshToken, accessToken }) => this._executeRequest(`${this._config.apiHost}/api/commerce/customer/authtickets/refresh/?refreshToken=${refreshToken}`, 'PUT', undefined, accessToken);
  getAppAuthToken: () => Promise<string> = async () => {
    await this._ensureAuthTicket();
    if (this._authClientTicket !== undefined && this._authClientTicket !== null && this._authClientTicket.access_token !== null)
      return this._authClientTicket.access_token;
    return '';
  }
}
