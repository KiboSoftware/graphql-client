import { CreateApolloClient } from "../../src/create-apollo-client";
import { getMockAuthHooks } from "../fixtures";

describe("Create Apollo Client", () => {
  beforeAll(() => {
    jest.enableAutomock();
  });
  it("should create apollo client without auth hooks", async () => {
    const config = {
      api: {
        authHost: "host",
        clientId: "app",
        sharedSecret: "123",
        apiHost: "api-host",
      },
    } as any;
    const client = CreateApolloClient(config);
  });

  it("should create apollo client with auth hooks", () => {
    const config = {
      api: {
        authHost: "host",
        clientId: "app",
        sharedSecret: "123",
        apiHost: "api-host",
      },
      clientAuthHooks: getMockAuthHooks(),
    } as any;
    const clientWithHooks = CreateApolloClient(config)
    expect(clientWithHooks.shopperAuthManager).toBeTruthy()
  });
  afterAll(() => {
    jest.disableAutomock();
  });
});
