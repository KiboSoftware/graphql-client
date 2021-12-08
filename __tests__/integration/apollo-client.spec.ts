import gql from "graphql-tag";
import nock from "nock";

import { CreateApolloClient } from "../../src/";
import { apiConfig, authTicket, shopperAuthTicket } from "../fixtures";

const configFixture = {
  api: apiConfig,
};

describe("integration client test", () => {
  beforeAll(() => {
    nock(`${apiConfig.authHost}`)
      .post(`/api/platform/applications/authtickets/oauth`)
      .reply(200, authTicket);

    nock(`${apiConfig.apiHost}/`)
      .get(`/api/commerce/customer/authtickets/anonymousshopper`)
      .reply(200, shopperAuthTicket);

    const queryResponse = { data: { products: { startIndex: 0 } } };

    nock(`${apiConfig.apiHost}`)
      .persist()
      .post("/graphql")
      .reply(200, queryResponse);
  });
  it("should query products", async () => {
    const client = CreateApolloClient(configFixture as any);
    const query = gql`
      query {
        products {
          startIndex
        }
      }
    `;
    const response = await client.query({ query });
    expect(response.data.products.startIndex).toBe(0);
  });

  it("should call auth hooks", async () => {
    const configWithHook = {
      ...configFixture,
      clientAuthHooks: {
        onTicketChange: jest.fn(),
        onTicketRead: jest.fn(),
        onTicketRemove: jest.fn(),
      },
    };
    const client = CreateApolloClient(configWithHook as any);
    const query = gql`
      query {
        products {
          startIndex
        }
      }
    `;
    const response = await client.query({ query });
    expect(configWithHook.clientAuthHooks.onTicketRead).toBeCalled();
    expect(configWithHook.clientAuthHooks.onTicketChange).toBeCalled();
  });
  it("should create client from env variables",  async () => {
      const client = CreateApolloClient();
      const query = gql`
        query {
          products {
            startIndex
          }
        }
      `;
      const response = await client.query({ query });
      expect(response.data.products.startIndex).toBe(0);
  })
});
