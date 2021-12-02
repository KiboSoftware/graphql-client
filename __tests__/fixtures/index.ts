export const apiConfig = {
  authHost: process.env.AUTH_URL,
  clientId: process.env.CLIENT_ID,
  sharedSecret: process.env.SHARED_SECRET,
  apiHost: process.env.API_HOST,
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
    ...mockHooks
  }
}
export const shopperAuthTicket = {
  accessToken: "string",
  accessTokenExpiration: '2031-11-03T19:47:38.010Z',
  refreshToken: "string",
  refreshTokenExpiration: '2031-11-03T19:47:38.010Z',
};
export const expiredShopperAuthTicket = {
  accessToken: "string",
  accessTokenExpiration: '2001-11-03T19:47:38.010Z',
  refreshToken: "string",
  refreshTokenExpiration: '2001-11-03T19:47:38.010Z',
};

export  const authTicket = {
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