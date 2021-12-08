import {
  getHostFromUrl,
  normalizeShopperAuthResponse,
  getProxyAgent,
  calculateTicketExpiration,
  isValidConfig,
  makeKiboAPIHeaders,
  getKiboHostedConfig,
  getApiConfigFromEnv,
  addProtocolToHost,
  formatConfigHostnames
} from "../../src/lib/util";
import { mozuHosted } from '../fixtures'
describe("kibo graphql client utils ", () => {
  beforeAll(() => {
    process.env.HTTPS_PROXY = "https://localhost:1234";
  });
  afterAll(() => {
    process.env.HTTPS_PROXY = undefined;
    delete process.env.mozuHosted;
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

  it("should check if create kibo api headers from hosted config", () => {
      const kiboHostedConfig = {
        "app-claims":"WOeFU9J89c2BkxqTX3y==",
        "user-claims": "i2YAJXACP3",
        tenant: "30294",
        site: "50525",
        "master-catalog": "1",
        catalog: "1",
        "dataview-mode": "Live"
      }
      const expected = {
        "x-vol-app-claims":"WOeFU9J89c2BkxqTX3y==",
        "x-vol-user-claims": "i2YAJXACP3",
        "x-vol-tenant": "30294",
        "x-vol-site": "50525",
        "x-vol-master-catalog": "1",
        "x-vol-catalog": "1"
      }
      const apiHeaders = makeKiboAPIHeaders(kiboHostedConfig)
      expect(apiHeaders).toEqual(expected)
  })
  it("should parse mozu hosted env variables", () => {

    process.env.mozuHosted = mozuHosted;
    const expected = {
      baseUrl: "https://test-rp",
      basePciUrl: "https://payments-sb.mozu.com",
      tenantPod: "https://test-rp",
      "app-claims":"WOeFU9J89c2BkxqTX3y==",
      "user-claims": "i2YAJXACP3",
      tenant: "30294",
      site: "50525",
      "master-catalog": "1",
      catalog: "1",
      "dataview-mode": "Live",
    };
    const hostedConfig = getKiboHostedConfig()

    expect(hostedConfig).toEqual(expected);
  })

  it('should create apollo client config from standard kibo env variables', () => {
    
    process.env.KIBO_CLIENT_ID = 'client';
    process.env.KIBO_SHARED_SECRET = 'secret';
    process.env.KIBO_AUTH_HOST = 'auth-url';
    process.env.KIBO_API_HOST = 'api-url';

    const expected = {
      clientId: "client",
      sharedSecret: "secret",
      authHost: "auth-url",
      apiHost: "api-url",
    }
    
    const config = getApiConfigFromEnv()
    
    expect(config).toEqual(expected)
  })

  it('should add https protocol to hostname', () => {
    const hostname = 'kibocommerce.com'
    const url = addProtocolToHost(hostname)
    expect(url).toEqual('https://kibocommerce.com')
  })

  it('should format all host names in config', () => {
    const config = {
      clientId: "client",
      sharedSecret: "secret",
      authHost: "auth-url",
      apiHost: "api-url",
    }
    const expected = {
      clientId: "client",
      sharedSecret: "secret",
      authHost: "https://auth-url",
      apiHost: "https://api-url",
    }
    const actual = formatConfigHostnames(config)
    expect(actual).toEqual(expected)
  })

});
