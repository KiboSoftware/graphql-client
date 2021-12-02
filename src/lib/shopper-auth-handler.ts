import type {
  UserAuthFetcher,
  UserAuthTicket,
  AuthHooks,
  LoginParameters,
} from "../types";
import { isShopperAuthExpired } from "./util";

export class ShopperAuthManager {
  private _userAuthClient: UserAuthFetcher;
  private _authTicket: UserAuthTicket | undefined;
  private _hooks: AuthHooks | undefined;
  private _pendingTicketPromise: Promise<string> | undefined;

  constructor(userAuthClient: UserAuthFetcher, authHooks: AuthHooks) {
    if (!userAuthClient) {
      throw new Error(
        "Kibo Shopper Auth Handler requires User Auth Fetcher Implementation"
      );
    }
    this._userAuthClient = userAuthClient;
    this._hooks = authHooks;
    this._authTicket = authHooks?.onTicketRead();
  }
  broadcastTicketUpdate(oldValue?: UserAuthTicket, newValue?: UserAuthTicket) {
    if (oldValue && !newValue) {
      this._hooks?.onTicketRemove();
    } else if (oldValue?.accessToken !== newValue?.accessToken) {
      this._hooks?.onTicketChange(newValue as UserAuthTicket);
    }
  }
  setTicket(authTicket?: UserAuthTicket) {
    const prev = this._authTicket ? { ...this._authTicket } : undefined;
    this._authTicket = authTicket;
    this.broadcastTicketUpdate(prev, authTicket);
  }
  private async _handlePendingTicketResponse(
    ticketPromise: Promise<UserAuthTicket>
  ): Promise<string> {
    const authTicket = await ticketPromise;
    this.setTicket(authTicket);
    this._pendingTicketPromise = undefined;
    return authTicket?.accessToken;
  }
  async getAccessToken(): Promise<string> {
    //if ticket fetch in progress, return current promise to avoid multiple access tokens
    if (this._pendingTicketPromise) {
      return this._pendingTicketPromise;
    }
    if(this._authTicket){
      const expired = isShopperAuthExpired(this._authTicket)
    }
    // return current valid access token if available
    if (this._authTicket && !isShopperAuthExpired(this._authTicket)) {
      return this._authTicket?.accessToken;
    }

    let ticketFetchOperation: any;
    if (this._authTicket && isShopperAuthExpired(this._authTicket)) {
      ticketFetchOperation = this._userAuthClient.refreshUserAuth(
        this._authTicket
      );
    } else {
      ticketFetchOperation = this._userAuthClient.anonymousAuth();
    }
    this._pendingTicketPromise =
      this._handlePendingTicketResponse(ticketFetchOperation);

    return this._pendingTicketPromise;
  }
  async loginCustomerAndSetAuthTicket(
    loginParams: LoginParameters
  ): Promise<UserAuthTicket> {
    const userAuthTicket = await this._userAuthClient.customerPasswordAuth(
      loginParams
    );
    this.setTicket(userAuthTicket);
    return userAuthTicket;
  }
}
