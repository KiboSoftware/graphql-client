import { APIAuthClient } from "../../src/lib/api-auth-client";
import { getProxyAgent, calculateTicketExpiration, addProtocolToHost } from "../../src/lib/util";

import { getMockFetcher, authTicket, expiredAuthTicket } from '../fixtures'

jest.mock("../../src/lib/util", () => ({
  calculateTicketExpiration: jest.fn(
    (mockedTicket) => mockedTicket?.expires_at
  ),
  getProxyAgent: jest.fn(() => ({})),
  addProtocolToHost: jest.fn(host => host)
}));

describe("kibo graphql client - api authentication client ", () => {

  function getMockCache(mockTicket: any) {
    return {
      getAuthTicket: jest.fn(async () => mockTicket),
      setAuthTicket: jest.fn(),
    };
  }

  const mockConfig = {
    clientId: "app.release",
    sharedSecret: "secret",
    authHost: "auth-host",
    apiHost: "host",
  };
  it("Should throw an error for missing clientId, sharedSecret, authUrl", () => {
    expect(() => {
      const apiAuthClient = new APIAuthClient(
        { clientId: null, sharedSecret: null, authHost: null, apiHost: "host" } as any,
        getMockFetcher(authTicket)
      );
    }).toThrow();
  });
  it("Should throw an error for missing fetch implemenation", () => {
    expect(() => {
      const apiAuthClient = new APIAuthClient(mockConfig, null);
    }).toThrow();
  });

  it("should call authenticate", async () => {
    const apiAuthClient = new APIAuthClient(
      mockConfig,
      getMockFetcher(authTicket)
    );
    const apiAuthTicket = await apiAuthClient.authenticate();
    expect(apiAuthTicket).toEqual(authTicket);
  });

  it("should perform ticket refresh", async () => {
    const apiAuthClient = new APIAuthClient(
      mockConfig,
      getMockFetcher(authTicket)
    );
    const apiAuthTicket = await apiAuthClient.refreshTicket(
      expiredAuthTicket as any
    );
    expect(apiAuthTicket).toEqual(authTicket);
  });

  it("should call refreshticket when getting access token", async () => {
    const apiAuthClient = new APIAuthClient(
      mockConfig,
      {},
      getMockCache(expiredAuthTicket)
    );
    apiAuthClient.refreshTicket = jest.fn();
    await apiAuthClient.getAccessToken();
    expect(apiAuthClient.refreshTicket).toBeCalled();
  });

  it("should call authenticate when getting access token", async () => {
    const apiAuthClient = new APIAuthClient(mockConfig, {});
    apiAuthClient.authenticate = jest.fn();
    await apiAuthClient.getAccessToken();
    expect(apiAuthClient.authenticate).toBeCalled();
  });
});
