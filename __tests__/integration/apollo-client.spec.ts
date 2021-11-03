import gql from "graphql-tag";
import { CreateApolloClient } from "../../src/create-apollo-client";

import { apiConfig } from "../fixtures";

const configFixture = {
  api: apiConfig
};

describe("integration client test", () => {
  
  it("should query products", async () => {
    const client = CreateApolloClient(configFixture as any);
    const query = gql`query { products { startIndex } }`;
    const response = await client.query({ query });
    expect(response.data.products.startIndex).toBe(0)
  });
  
  it('should call auth hooks', async () => {
    const configWithHook = {
      ...configFixture,
      clientAuthHooks: {
        onTicketChange: jest.fn(),
        onTicketRead: jest.fn(),
        onTicketRemove: jest.fn()
      }
    }
    const client = CreateApolloClient(configWithHook as any);
    const query = gql`query { products { startIndex } }`;
    const response = await client.query({ query });
    expect(configWithHook.clientAuthHooks.onTicketRead).toBeCalled()
    expect(configWithHook.clientAuthHooks.onTicketChange).toBeCalled()
  });
});
