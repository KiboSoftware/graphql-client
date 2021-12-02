import NodeCache from "node-cache";
import type { AuthTicketCache, AppAuthTicket } from "../types";

export class ApiAuthCache implements AuthTicketCache {
  private _cache;
  private _key;
  constructor(key: string) {
    this._cache = new NodeCache();
    this._key = key;
  }
  async getAuthTicket() {
    return this._cache.get<AppAuthTicket | undefined>(this._key);
  }
  setAuthTicket(authTicket: AppAuthTicket) {
    this._cache.set(this._key, authTicket);
  }
}
