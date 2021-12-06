## Features

* Kibo Application Authentication
* Kibo Shopper Authentication Hooks
* [Apollo Graphql Client](https://github.com/apollographql/apollo-client)


## Installation

To install:
```
npm install @kibocommerce/graphql-client
```

## Configuration
To create an instance of the graphql client, the following configuration is required: 

```json
{
    "accessTokenUrl": "https://home.mozu.com/api/platform/applications/authtickets/oauth",
    "clientId": "KIBO_APP.1.0.0.Release",
    "sharedSecret": "12345_Secret",
    "apiHost": "https://kibo-site.com"
}
```
- `apiHost` - link to your Kibo Commerce GraphQL API instance.
- `accessTokenUrl` - link to Kibo Commerce Authentication Server. It is used to request an access token from Kibo Commerce OAuth 2.0 service.
- `clientId` - Unique Application (Client) ID of your Application
- `sharedSecret` - Secret API key used to authenticate application. Viewable from your [Kibo eCommerce Dev Center](https://mozu.com/login)

Visit [Kibo documentation](https://apidocs.kibong-perf.com/?spec=graphql#auth) for more details on API authentication


Based on the config, this package will handle Authenticating your application against the Kibo API.
 
## Basic Usage

```jsx
import { CreateApolloClient } from '@kibocommerce/graphql-client';

const client = CreateApolloClient({
    api: {
        accessTokenUrl,
        clientId,
        sharedSecret,
        apiHost
    }
});
const query = gql`query getProduct($productCode: String){
  product(productCode:$productCode){
    productCode
  }
}`;
const variables = {
    productId: "PROD-123"
};
const { data } = await client.query({  query, variables })
```

## Authentication Hooks

Hooks can be provided to the ```CreateApolloClient``` method when creating an apollo client that will execute on Auth Ticket change, read and remove. 

```ts
export interface KiboApolloClientConfig {
  api: KiboApolloApiConfig;
  clientAuthHooks: {
    onTicketChange: (authTicket: UserAuthTicket) => void;
    onTicketRead: () => UserAuthTicket;
    onTicketRemove: () => void;
  };
}
```

The Auth ticket is passed as requests to the GraphQL server as a customer ```x-vol-user-claims``` header and used to identify / authorize the user.  This auth ticket works for both authenticated and anonymous shoppers. Allowing for guest checkout scenarios.

These built in hooks allow customization on storage methods for the users auth ticket.

```jsx
import { CreateApolloClient } from '@kibocommerce/graphql-client';

let currentTicket = getUserAuthorizationFromCooke();
const clientAuthHooks = {
    onTicketChange: (authTicket) => {
        currentTicket = authTicket;
        setUserAuthorizationCookie(authTicket);
    },
    onTicketRead: () => {
        return currentTicket;
    },
    onTicketRemove: () => {
        removeUserAuthorizationCookie();
    }
}

const client = CreateApolloClient({
    api: config,
    clientAuthHooks
});

const query = gql`query getCurrentCart {
    currentCart {
        total
    }
}`

const { data } = await client.query({ query });

```

## Override Headers per Request

Headers can be overridden per request by providing a headers object with key-value pairs (header name and header value) to the query/mutation context object

Example to remove a Shoppers Auth Claim for a single request 
```jsx

import { CreateApolloClient } from '@kibocommerce/graphql-client';

const client = CreateApolloClient();
const query = gql`query getCurrentCart {
    currentCart {
        total
    }
}`
const { data } = await client.query({
    query,
    context: {
      headers: {
        'x-vol-user-claims': null
      }
    }
  });
```

## Use inside Kibo's ArcJS Framework (API Extensions)

When using this package inside of Kibo's ArcJS framework, the API config and Auth hooks are no longer required to create a client instance. Instead the API config will be handled automatically based on the executing environment context and the Shopper authentication will be re-used based on the executing Arc API action (when available). Any API config parameters or auth hooks passed to the CreateApolloClient function will simply be ignored.

```jsx
// Arc.JS Action
import { CreateApolloClient } from '@kibocommerce/graphql-client';

const client = CreateApolloClient();
const query = gql`query getCurrentCart {
    currentCart {
        total
    }
}`
const { data } = await client.query({ query });
```


## Proxy Requests in Development


If you would like to see the requests to the Apollo GraphQL server, you need to set the HTTPS_PROXY environment variable to whatever proxy application you are using.

```
HTTPS_PROXY="http://127.0.0.1:8866"
```

## Note

If this client library is used in a browser environment, ensure your Kibo Application is configured with Storefront only permsisions as the API Key and secret will be visible.
