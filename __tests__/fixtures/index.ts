export const apiConfig = {
  authHost: process.env.KIBO_AUTH_HOST,
  clientId: process.env.KIBO_CLIENT_ID,
  sharedSecret: process.env.KIBO_SHARED_SECRET,
  apiHost: process.env.KIBO_API_HOST,
};

export function getMockFetcher(mockAuthTicket: any) {
  const fetcher = async () => ({
    json: jest.fn(() => mockAuthTicket),
  });
  return fetcher;
}

export function getMockAuthHooks(mockHooks = {}) {
  return {
    onTicketRead: jest.fn(),
    onTicketChange: jest.fn(),
    onTicketRemove: jest.fn(),
    ...mockHooks,
  };
}
export const shopperAuthTicket = {
  accessToken: "string",
  accessTokenExpiration: "2031-11-03T19:47:38.010Z",
  refreshToken: "string",
  refreshTokenExpiration: "2031-11-03T19:47:38.010Z",
};
export const expiredShopperAuthTicket = {
  accessToken: "string",
  accessTokenExpiration: "2001-11-03T19:47:38.010Z",
  refreshToken: "string",
  refreshTokenExpiration: "2001-11-03T19:47:38.010Z",
};

export const authTicket = {
  access_token: "string",
  token_type: "string",
  expires_in: 3600,
  expires_at: 568997884405762,
};
export const expiredAuthTicket = {
  access_token: "string",
  token_type: "string",
  expires_in: 3600,
  expires_at: 100,
};

export const mozuHosted = JSON.stringify({
  sdkConfig: {
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
  },
});
