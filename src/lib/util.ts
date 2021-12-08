import type {
  AppAuthTicket,
  KiboApolloClientConfig,
  UserAuthTicket,
} from "../types";
import httpProxy from "http-proxy-agent";
import httpsProxy from "https-proxy-agent";


const constants = {
  headerPrefix: "x-vol-",
  headers: {
    APPCLAIMS: "app-claims",
    USERCLAIMS: "user-claims",
    TENANT: "tenant",
    SITE: "site",
    MASTERCATALOG: "master-catalog",
    CATALOG: "catalog",
  },
};

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
  const { api: apiConfig } = config || {};

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

export const getKiboHostedConfig = () => {
  try {
    return JSON.parse(process.env.mozuHosted as string).sdkConfig;
  } catch (error) {
    throw new Error(
      "Error parsing Kibo Hosted environment variables: " + error.message
    );
  }
};

export const makeKiboAPIHeaders = (kiboHostedConfig: any) => {

  return Object.values(constants.headers).reduce((accum: any, headerSuffix) => {
    if (!kiboHostedConfig[headerSuffix]) {
      return accum;
    }
    const headerName = `${constants.headerPrefix}${headerSuffix}`;
    accum[headerName] = kiboHostedConfig[headerSuffix];
    return accum;
  }, {});
};

export const getApiConfigFromEnv = () => ({
    clientId: process.env.KIBO_CLIENT_ID as string,
    sharedSecret: process.env.KIBO_SHARED_SECRET as string,
    authHost: process.env.KIBO_AUTH_URL as string,
    apiHost: process.env.KIBO_API_URL as string,
})