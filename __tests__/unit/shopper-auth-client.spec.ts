import { ShopperAuthClient } from "../../src/lib/shopper-auth-client";
import {
  getProxyAgent,
  calculateTicketExpiration,
  normalizeShopperAuthResponse,
  addProtocolToHost
} from "../../src/lib/util";
import {
  getMockFetcher,
  expiredShopperAuthTicket,
  shopperAuthTicket,
} from "../fixtures";

jest.mock("../../src/lib/util", () => ({
  calculateTicketExpiration: jest.fn(),
  getProxyAgent: jest.fn(() => ({})),
  normalizeShopperAuthResponse: jest.fn((response) => response),
  addProtocolToHost: jest.fn(host => host)
}));

const mockAPIAuthClient = {
  getAccessToken: jest.fn(async () => "1234"),
};

const mockConfig = { apiHost: "host" } as any;

describe("kibo shopper authentication client ", () => {
  it("Should throw an error for missing apiHost", () => {
    expect(() => {
      const shopperAuthClient = new ShopperAuthClient({} as any, {}, {} as any);
    }).toThrow();
  });
  it("Should throw an error for missing fetch implementation", () => {
    expect(() => {
      const shopperAuthClient = new ShopperAuthClient(
        mockConfig,
        null,
        {} as any
      );
    }).toThrow();
  });
  it("Should throw an error for missing API Auth Client", () => {
    expect(() => {
      const shopperAuthClient = new ShopperAuthClient(
        mockConfig,
        {},
        false as any
      );
    }).toThrow();
  });

  it("should get anonymous shopper auth ticket", async () => {
    const apiAuthClient = new ShopperAuthClient(
      mockConfig,
      getMockFetcher(shopperAuthTicket),
      mockAPIAuthClient as any
    );
    const apiAuthTicket = await apiAuthClient.anonymousAuth();
    expect(apiAuthTicket).toEqual(shopperAuthTicket);
  });

  it("should perform shopper login", async () => {
    const apiAuthClient = new ShopperAuthClient(
      mockConfig,
      getMockFetcher(shopperAuthTicket),
      mockAPIAuthClient as any
    );
    const loginParams = {
      username: "tester",
      password: "password",
    };
    const apiAuthTicket = await apiAuthClient.customerPasswordAuth(loginParams);
    expect(apiAuthTicket).toEqual(shopperAuthTicket);
  });

  it("should perform shopper auth refresh", async () => {
    const apiAuthClient = new ShopperAuthClient(
      mockConfig,
      getMockFetcher(shopperAuthTicket),
      mockAPIAuthClient as any
    );
    const apiAuthTicket = await apiAuthClient.refreshUserAuth(expiredShopperAuthTicket);
    expect(apiAuthTicket).toEqual(shopperAuthTicket);
  });
});
