import type {
  FetchOptions,
  LoginParameters,
  UserAuthTicket,
  KiboApolloApiConfig,
  APIAuthenticationFetcher,
  UserAuthFetcher,
} from "../types";
import { getProxyAgent, normalizeShopperAuthResponse, addProtocolToHost } from "./util";

export class ShopperAuthClient implements UserAuthFetcher {
  private _apiHost: string;
  private _apiAuthClient: APIAuthenticationFetcher;
  private _fetcher: any;

  constructor(
    { apiHost }: KiboApolloApiConfig,
    fetcher: any,
    apiAuthClient: APIAuthenticationFetcher
  ) {
    if (!apiHost) {
      throw new Error("Kibo Shopper Auth client requires a API host url");
    }
    if (!fetcher) {
      throw new Error(
        "Kibo Shopper Auth client requires a Fetch API implementation"
      );
    }
    if (!apiAuthClient) {
      throw new Error(
        "Kibo Shopper Auth Client requires an API Authentication client"
      );
    }
    this._apiHost = addProtocolToHost(apiHost) as string;
    this._fetcher = fetcher;
    this._apiAuthClient = apiAuthClient;
  }

  private async _buildFetchOptions(options: any = {}): Promise<FetchOptions> {
    const { method = "GET", headers = {}, body } = options;
    const accessToken = await this._apiAuthClient.getAccessToken();

    return {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...getProxyAgent(),
    };
  }

  private async _fetchShopperAuthTicket(
    url: string,
    options: FetchOptions
  ): Promise<UserAuthTicket> {
    try {
      const response = await this._fetcher(url, options);
      if (response.statusCode > 200) {
        console.error(response.text());
        throw new Error("Bad Request");
      }
      const authResponse = await response.json();
      return normalizeShopperAuthResponse(authResponse);
    } catch (error) {
      console.error(error);
    }
    return {} as any;
  }

  public async anonymousAuth(): Promise<UserAuthTicket> {
    const options = await this._buildFetchOptions();
    const url = `${this._apiHost}/api/commerce/customer/authtickets/anonymousshopper`;
    return this._fetchShopperAuthTicket(url, options);
  }

  public async customerPasswordAuth(
    loginParams: LoginParameters
  ): Promise<UserAuthTicket> {
    const options = await this._buildFetchOptions({
      body: loginParams,
      method: "POST",
    });
    const url = `${this._apiHost}/api/commerce/customer/authtickets`;
    return this._fetchShopperAuthTicket(url, options);
  }

  public async refreshUserAuth(
    userAuthTicket: UserAuthTicket
  ): Promise<UserAuthTicket> {
    const { refreshToken } = userAuthTicket;
    const options = await this._buildFetchOptions({ method: "PUT" });
    const url = `${this._apiHost}/api/commerce/customer/authtickets/refresh/?refreshToken=${refreshToken}`;
    return this._fetchShopperAuthTicket(url, options);
  }
}
