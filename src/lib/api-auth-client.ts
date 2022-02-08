import type {
  AuthTicketCache,
  FetchOptions,
  AppAuthTicket,
  KiboApolloApiConfig,
  APIAuthenticationFetcher,
} from "../types";
import { getProxyAgent, calculateTicketExpiration, addProtocolToHost } from "./util";

export class APIAuthClient implements APIAuthenticationFetcher {
  private _clientId: string;
  private _sharedSecret: string;
  private _authHost: string;
  private _authTicketCache?: AuthTicketCache;
  private _fetcher: any;

  constructor(
    { clientId, sharedSecret, authHost }: KiboApolloApiConfig,
    fetcher: any,
    authTicketCache?: AuthTicketCache
  ) {
    if (!clientId || !sharedSecret || !authHost) {
      throw new Error(
        "Kibo API Auth client requires a clientId, sharedSecret, and authUrl"
      );
    }
    if (!fetcher) {
      throw new Error(
        "Kibo API Auth client requires a Fetch API implementation"
      );
    }
    this._clientId = clientId;
    this._sharedSecret = sharedSecret;
    this._authHost = addProtocolToHost(authHost) as string;
    this._fetcher = fetcher;

    if (authTicketCache) {
      this._authTicketCache = authTicketCache;
    }
  }

  private _buildFetchOptions(body: any = {}): FetchOptions {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      ...getProxyAgent(),
    };
  }

  private async _fetchAuthTicket(
    url: string,
    options: FetchOptions
  ): Promise<AppAuthTicket> {
    // fetch app auth ticket
    const response: Response = await this._fetcher(url, options);
    const authTicket = (await response.json()) as AppAuthTicket;
    // set expiration time in ms on auth ticket
    authTicket.expires_at = calculateTicketExpiration(authTicket);
    return authTicket;
  }

  public async authenticate(): Promise<AppAuthTicket> {
    // create oauth fetch options
    const options = this._buildFetchOptions({
      client_id: this._clientId,
      client_secret: this._sharedSecret,
      grant_type: "client_credentials",
    });
    // perform authentication
    const authTicket = await this._fetchAuthTicket(
      `${this._authHost}/api/platform/applications/authtickets/oauth`,
      options
    );
    // set authentication ticket on next server runtime object
    this._authTicketCache?.setAuthTicket(authTicket);

    return authTicket;
  }

  public async refreshTicket(kiboAuthTicket: AppAuthTicket) {
    // create oauth refresh fetch options
    const options = this._buildFetchOptions({
      refreshToken: kiboAuthTicket?.refresh_token,
    });
    // perform auth ticket refresh
    const refreshedTicket = await this._fetchAuthTicket(
      `${this._authHost}/api/platform/applications/authtickets/refresh-ticket`,
      options
    );
    // set authentication ticket on next server runtime object
    this._authTicketCache?.setAuthTicket(refreshedTicket);

    return refreshedTicket;
  }

  public async getAccessToken(): Promise<string> {
    // get current Kibo API auth ticket
    let authTicket = await this._authTicketCache?.getAuthTicket();

    // if no current ticket, perform auth
    // or if ticket expired, refresh auth
    if (!authTicket) {
      authTicket = await this.authenticate();
    } else if (authTicket.expires_at < Date.now()) {
      authTicket = await this.refreshTicket(authTicket);
    }
    return authTicket?.access_token as string;
  }
}
