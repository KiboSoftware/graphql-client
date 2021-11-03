import { ShopperAuthManager } from "../../src/lib/shopper-auth-handler";
import type { UserAuthTicket } from "../../src/types";
import {
  getMockAuthHooks,
  shopperAuthTicket,
  expiredShopperAuthTicket,
} from "../fixtures";

function getMockAuthClient() {
  return {
    anonymousAuth: jest.fn(),
    customerPasswordAuth: jest.fn(),
    refreshUserAuth: jest.fn(),
  };
}
describe("Shopper Authentication manager ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create throw an error for missing Shopper Auth Client call to constructor ", () => {
    expect(() => {
      const shopperAuthClient = new ShopperAuthManager(
        undefined as any,
        {} as any
      );
    }).toThrow();
  });

  it("should trigger Auth Hook onTicketRemove", () => {
    const mockHooks = getMockAuthHooks();
    const shopperAuthClient = new ShopperAuthManager(
      getMockAuthClient(),
      mockHooks
    );
    shopperAuthClient.broadcastTicketUpdate({} as UserAuthTicket, undefined);
    expect(mockHooks.onTicketRemove).toBeCalledTimes(1);
  });

  it("should set new ticket and trigger Auth Hook onTicketChange", () => {
    const mockHooks = getMockAuthHooks();
    const shopperAuthClient = new ShopperAuthManager(
      getMockAuthClient(),
      mockHooks
    );
    shopperAuthClient.setTicket(shopperAuthTicket as UserAuthTicket);
    expect(mockHooks.onTicketChange).toBeCalledTimes(1);
  });

  it("should return access token of current auth ticket", async () => {
    jest.mock("../../src/lib/util", () => ({
      isShopperAuthExpired: jest.fn(() => false),
    }));
    const mockHooks = getMockAuthHooks();
    const shopperAuthClient = new ShopperAuthManager(
      getMockAuthClient(),
      mockHooks
    );
    shopperAuthClient.setTicket(shopperAuthTicket as UserAuthTicket);
    const accessToken = await shopperAuthClient.getAccessToken();
    expect(accessToken).toBe(shopperAuthTicket.accessToken);
  });

  it("should return access token after refreshing token", async () => {
    const mockHooks = getMockAuthHooks();
    const mockAuthClient = {
      anonymousAuth: jest.fn(),
      customerPasswordAuth: jest.fn(),
      refreshUserAuth: jest.fn(),
    };
    const shopperAuthClient = new ShopperAuthManager(mockAuthClient, mockHooks);

    shopperAuthClient.setTicket(expiredShopperAuthTicket as UserAuthTicket);
    const accessToken = await shopperAuthClient.getAccessToken();
    expect(mockAuthClient.refreshUserAuth).toBeCalled();
  });

  it("should return access token for anonymous shopper", async () => {
    const mockHooks = getMockAuthHooks();
    const mockAuthClient = {
      anonymousAuth: jest.fn(),
      customerPasswordAuth: jest.fn(),
      refreshUserAuth: jest.fn(),
    };
    const shopperAuthClient = new ShopperAuthManager(mockAuthClient, mockHooks);
    const accessToken = await shopperAuthClient.getAccessToken();
    expect(mockAuthClient.anonymousAuth).toBeCalled();
  });

  it("should return access token for anonymous shopper", async () => {
    const mockHooks = getMockAuthHooks();
    const mockAuthClient = {
      anonymousAuth: jest.fn(),
      customerPasswordAuth: jest.fn(),
      refreshUserAuth: jest.fn(),
    };
    const shopperAuthClient = new ShopperAuthManager(mockAuthClient, mockHooks);
    shopperAuthClient.setTicket = jest.fn();
    await shopperAuthClient.loginCustomerAndSetAuthTicket({
      username: "",
      password: "",
    });
    expect(mockAuthClient.customerPasswordAuth).toBeCalled();
    expect(shopperAuthClient.setTicket).toBeCalled();
  });
});
