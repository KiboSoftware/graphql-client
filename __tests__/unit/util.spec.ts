import {
  getHostFromUrl,
  normalizeShopperAuthResponse,
  getProxyAgent,
  calculateTicketExpiration,
  isValidConfig,
} from "../../src/lib/util";

describe("kibo graphql client utils ", () => {
  beforeAll(() => {
    process.env.HTTPS_PROXY = "https://localhost:1234";
  });
  afterAll(() => {
    process.env.HTTPS_PROXY = undefined;
  });
  it("should get fully qualified host from url", () => {
    const authURL =
      "https://mozu.com/api/platform/applications/authtickets/oauth";
    const authHost = getHostFromUrl(authURL);
    expect(authHost).toEqual("https://mozu.com/");
  });

  it("should normalize api auth response and drop extra props", () => {
    const rawData = {
      customer: { name: "boo" },
      jwtToken: {},
      accessToken: "data",
      accessTokenExpiration: "data",
      refreshToken: "data",
      userId: "data",
      refreshTokenExpiration: "data",
    };
    const expected = {
      accessToken: "data",
      accessTokenExpiration: "data",
      refreshToken: "data",
      userId: "data",
      refreshTokenExpiration: "data",
    };

    const normalizedData = normalizeShopperAuthResponse(rawData);

    expect(normalizedData).toEqual(expected);
  });

  it("should return fetch options with proxy agent", () => {
    const options = getProxyAgent();
    expect(options.agent).toBeDefined();
  });
  it("should calculate api auth ticket expiration", () => {
    Date.now = jest.fn(() => 100);
    const mockTicket = { expires_in: 100 } as any;
    const expected = 100100;
    const expires_at = calculateTicketExpiration(mockTicket);
    expect(expires_at).toBe(expected);
  });
  it("should check that create apollo client config paramets are in-valid", () => {
    const isValid = isValidConfig({} as any);
    expect(isValid).toBeFalsy()
  });
  it("should check if create apollo client config paramets are valid", () => {
    const isValid = isValidConfig({ api: { apiHost: "api", authHost: 'auth', clientId: 'client', sharedSecret: 'secret'}} as any);
    expect(isValid).toBeTruthy()
  });
});
