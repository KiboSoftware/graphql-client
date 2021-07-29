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
    };
    unique_name: string;
    sub: string;
    sid: string;
    nbf: number;
    exp: number;
    iat: number;
    iss: string;
    aud: string;
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
export interface FetchOptions {
    method: string;
    headers: {
        [x: string]: any;
    };
    body: string;
    agent?: any;
    [x: string]: any;
}
export default class AuthClient {
    private _authClientTicket;
    private _reauth;
    private _config;
    private _ensureAuthTicket;
    private _executeRequest;
    constructor(config: KiboApolloApiConfig);
    anonymousAuth: () => Promise<UserAuthTicket>;
    customerPasswordAuth: (request: {
        username: string;
        password: string;
    }, ticket?: UserAuthTicket) => Promise<UserAuthTicket>;
    refreshUserAuth: (ticket: UserAuthTicket) => Promise<UserAuthTicket>;
    getAppAuthToken: () => Promise<string>;
}
//# sourceMappingURL=AuthClient.d.ts.map