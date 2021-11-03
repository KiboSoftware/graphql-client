import type {
  AppAuthTicket,
  KiboApolloClientConfig,
  UserAuthTicket,
} from "../types";
import httpProxy from "http-proxy-agent";
import httpsProxy from "https-proxy-agent";

export const calculateTicketExpiration = (kiboAuthTicket: AppAuthTicket) =>
  Date.now() + kiboAuthTicket.expires_in * 1000;

export const getProxyAgent = (): { agent: any } => {
  let options = { agent: null as any };
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    options.agent = process.env.HTTP_PROXY
      ? new httpProxy.HttpProxyAgent(process.env.HTTP_PROXY as string)
      : new httpsProxy.HttpsProxyAgent(process.env.HTTPS_PROXY as string);
  }
  return options;
};

export const isValidConfig: (config: KiboApolloClientConfig) => boolean = (
  config
) => {
  const { api: apiConfig } = config;

  if (
    !apiConfig ||
    !(apiConfig.accessTokenUrl || apiConfig.authHost) ||
    !apiConfig.apiHost ||
    !apiConfig.clientId ||
    !apiConfig.sharedSecret
  )
    return false;
  return true;
};
//naive method to grab auth host from auth url
export const getHostFromUrl = (url: string) => {
  const match = url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i);
  return (match && match[0]) || "";
};

// normalize anonymous / registered shopper auth ticket
export const normalizeShopperAuthResponse = (
  apiResponse: any
): UserAuthTicket => {
  const {
    accessToken,
    accessTokenExpiration,
    refreshToken,
    userId,
    refreshTokenExpiration,
  } = apiResponse;
  return {
    accessToken,
    accessTokenExpiration,
    refreshToken,
    userId,
    refreshTokenExpiration,
  } as UserAuthTicket;
};

export const isShopperAuthExpired = (userAuthTicket: UserAuthTicket) => {
  const { accessTokenExpiration } = userAuthTicket;
  return new Date(accessTokenExpiration).getTime() < Date.now();
};
