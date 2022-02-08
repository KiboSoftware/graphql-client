import { CreateApolloClient } from "../../src/create-apollo-client";
import { apiConfig, getMockAuthHooks } from "../fixtures";
import { getHostFromUrl, isValidConfig, getApiConfigFromEnv, formatConfigHostnames, addProtocolToHost } from "../../src/lib/util";

jest.mock("../../src/lib/util", () => ({
  getHostFromUrl: jest.fn(),
  isValidConfig: jest.fn(() => true),
  getApiConfigFromEnv: jest.fn(() => apiConfig),
  formatConfigHostnames: jest.fn(params => params),
  addProtocolToHost: jest.fn(host => host)
}));

describe("Create Apollo Client", () => {
  beforeAll(() => {
    jest.enableAutomock();
  });
  it("should create apollo client without auth hooks", async () => {
    const config = {
      api: apiConfig,
    } as any;
    const client = CreateApolloClient(config);
  });

  it("should create apollo client with auth hooks", () => {
    const config = {
      api: apiConfig,
      clientAuthHooks: getMockAuthHooks(),
    } as any;
    const clientWithHooks = CreateApolloClient(config)
    expect(clientWithHooks.shopperAuthManager).toBeTruthy()
  });

  it('should create client using env vars', () => {
    const client = CreateApolloClient()
    expect(getApiConfigFromEnv).toBeCalled()
  })
  afterAll(() => {
    jest.disableAutomock();
  });
});
