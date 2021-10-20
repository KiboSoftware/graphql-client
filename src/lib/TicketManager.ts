import { UserAuthTicket } from './AuthClient'
import AuthClient from './AuthClient'

export interface TicketStorageManager {
  ticketFetcher: (client: AuthClient) => Promise<UserAuthTicket>
  onTicketChanged: (ticket: UserAuthTicket) => void
  onTicketRefreshed: (ticket: UserAuthTicket) => void
  onTicketRemoved: () => void
}

export interface TicketManagerOptions {
  authClient: AuthClient
  storageManager: TicketStorageManager
  ticket?: UserAuthTicket
}

const formatTicket: (auth: UserAuthTicket) => UserAuthTicket = (auth) => {
  auth.accessTokenExpiration = new Date(auth.accessTokenExpiration)
  auth.refreshTokenExpiration = new Date(auth.refreshTokenExpiration)
  delete auth.jwtAccessToken
  return auth
}

export default class TicketManager {
  /// Private Fields
  private _authClient: AuthClient
  private _authTicket: UserAuthTicket | undefined
  private _storageManager: TicketStorageManager
  private _ticketFetcherPromise: UserAuthTicket | undefined
  private _ticketRefreshPromise: UserAuthTicket | undefined

  constructor(options: TicketManagerOptions) {
    this._authClient = options.authClient
    this._storageManager = options.storageManager
    if (options.ticket) this._authTicket = formatTicket(options.ticket)
  }

  /// Private Methods
  private _validateTicket: (authTicket: UserAuthTicket) => void = (
    authTicket,
  ) => {
    if (
      !authTicket.accessToken ||
      !authTicket.refreshToken ||
      !authTicket.jwtAccessToken
    )
      throw new Error('Invalid auth ticket!')
  }

  private _performTicketFetch: () => Promise<UserAuthTicket> = async () => {
    if (this._ticketFetcherPromise) return this._ticketFetcherPromise
    try {
      this._ticketFetcherPromise = await this._storageManager.ticketFetcher(
        this._authClient,
      )
      return this._ticketFetcherPromise
    } catch (err) {
      this._ticketFetcherPromise = undefined
      throw err
    }
  }

  private _performTicketRefresh: (
    authTicket: UserAuthTicket,
  ) => Promise<UserAuthTicket> = async (authTicket) => {
    if (this._ticketRefreshPromise) return this._ticketRefreshPromise
    try {
      this._ticketRefreshPromise = await this._authClient.refreshUserAuth(
        authTicket,
      )
      return this._ticketRefreshPromise
    } catch (err) {
      throw err
    } finally {
      this._ticketRefreshPromise = undefined
    }
  }

  private _refreshTicket: (
    authTicket?: UserAuthTicket,
  ) => Promise<UserAuthTicket> = async (authTicket) => {
    let newTicketPromise: UserAuthTicket
    try {
      if (authTicket !== null && authTicket !== undefined) {
        if (
          authTicket.refreshToken &&
          new Date() < authTicket.refreshTokenExpiration
        ) {
          newTicketPromise = await this._performTicketRefresh(authTicket)
        } else {
          newTicketPromise = await this._performTicketFetch()
        }
      } else {
        newTicketPromise = await this._performTicketFetch()
      }
      if (this._storageManager?.onTicketRefreshed)
        this._storageManager.onTicketRefreshed(newTicketPromise)
      return this.setTicket(newTicketPromise)
    } catch (err) {
      throw err
    }
  }

  /// Public Methods
  setTicket: (authTicket: UserAuthTicket) => UserAuthTicket = (authTicket) => {
    this._validateTicket(authTicket)
    this._authTicket = formatTicket(authTicket)
    this._storageManager?.onTicketChanged?.(authTicket)
    return authTicket
  }

  getTicket: () => Promise<UserAuthTicket> = async () => {
    if (this._authTicket && !TicketManager.isTicketExpired(this._authTicket))
      return Promise.resolve(this._authTicket)
    return this._refreshTicket(this._authTicket)
  }

  getToken: () => Promise<string> = async () => {
    try {
      const ticket = await this.getTicket()
      return ticket.accessToken || ''
    } catch (err) {
      throw err
    }
  }

  invalidateTicket: () => void = () => {
    this._authTicket = undefined
    this._storageManager.onTicketRemoved()
  }

  /// Static Methods
  static isTicketExpired: (authTicket: UserAuthTicket) => boolean = (
    authTicket,
  ) => {
    return (
      !authTicket ||
      !authTicket.accessToken ||
      !authTicket.accessTokenExpiration ||
      new Date() > authTicket.accessTokenExpiration
    )
  }
}
