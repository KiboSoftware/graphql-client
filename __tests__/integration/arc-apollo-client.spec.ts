import gql from "graphql-tag";
import nock from "nock";

import { CreateApolloClient } from "../../src/";
import { mozuHosted } from "../fixtures";

describe("integration client test", () => {
  beforeAll(() => {});
  beforeEach(() => {
    delete process.env.mozuHosted;
  });
  afterEach(() => {
    delete process.env.mozuHosted;
  });

  it("should create a Apollo Client for Kibo's ArcJS environment (API Extensions)", async () => {
    const queryResponse = { data: { products: { startIndex: 0 } } };

    nock("https://test-rp")
      .persist()
      .post(`/graphql`)
      .reply(200, queryResponse);
    process.env.mozuHosted = mozuHosted;
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
  });
});
