import fetch from 'isomorphic-fetch';
import jwt_decode from 'jwt-decode';
import { KiboApolloApiConfig } from '..';

export interface AppAuthTicket {
  access_token: string | null;
  token_type: string | null;
  expires_in: number;
  expires_at: Date | null;
  refresh_token: string | null;
}

export interface KiboJWT {
  "https://www.kibocommerce.com/app_claims": {
    ssl: string;
    ent: string;
    mtr: string;
    uc: string;
    rnd: number;
    aid: string;
    akey: string;
    bv: number[];
    exp: string;
    env: string;
    "b.appname": string;
  };  
  "https://www.kibocommerce.com/user_claims": {
    rnd: number;
    anon: string;
    uid: string;
    bv: number[];
    env: string;
    exp: string;
    st: string;
    "b.TenantId": string;
    "b.SiteId": string;
  }
  unique_name: string;
  sub: string,
  sid: string,
  nbf: number,
  exp: number,
  iat: number,
  iss: string,
  aud: string
}

export interface UserAuthTicket {
  accessToken: string;
  accessTokenExpiration: Date;
  refreshToken: string;
  refreshTokenExpiration: Date;
  userId: string | null;
  jwtAccessToken: string;
  parsedJWT: KiboJWT;
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
      const authResponse = await fetch(this._config.accessTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appTokenPostData)
      }).then(resp => resp.json()) as AppAuthTicket;
      authResponse.expires_at = new Date();
      authResponse.expires_at.setSeconds(authResponse.expires_at.getSeconds() + authResponse.expires_in);
      this._authClientTicket = authResponse;
    }
  };

  private _formatTicket: (auth: UserAuthTicket) => UserAuthTicket = (auth) => {
    auth.accessTokenExpiration = new Date(auth.accessTokenExpiration);
    auth.refreshTokenExpiration = new Date(auth.refreshTokenExpiration);
    if (auth.jwtAccessToken && typeof auth.jwtAccessToken === "string") {
      auth.parsedJWT = jwt_decode(auth.jwtAccessToken) as KiboJWT;
    }
    
    return auth;
  }

  private _executeRequest: (url: string, method: string, body?: any, userToken?: string) => Promise<any> = async (url, method, body, userToken) => {
    await this._ensureAuthTicket();
    const options: {
      headers: {
        Authorization: string;
        'Content-Type': string;
        'x-vol-user-claims'?: string;
        [x: string]: any;
      };
      method: string;
      body?: any;
      [x: string]: any;
    } = {
      headers: {
        'Authorization': `Bearer ${this._authClientTicket?.access_token}`,
        'Content-Type': 'application/json'
      },
      method,
      body
    };
    if (userToken) {
      options.headers['x-vol-user-claims'] = userToken;
    }
    const resp = await fetch(url, options);
  
    if (!resp.ok && resp.status === 401 && !this._reauth) {
      this._reauth = true;
      await this._ensureAuthTicket();
      return this._executeRequest(url, method, body);
    }
    this._reauth = false;
  
    return this._formatTicket(await resp.json() as UserAuthTicket);
  }

  constructor(config: KiboApolloApiConfig) {
    this._config = config;
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
