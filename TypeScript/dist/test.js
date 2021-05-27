"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const _1 = require(".");
(async function () {
    let rawTicket = "";
    let ticket = undefined;
    let clientAuthHooks = {
        onTicketChange: (authTicket) => {
            if (!ticket || ticket.accessToken !== authTicket.accessToken) {
                ticket = authTicket;
            }
        },
        onTicketRead: () => {
            return ticket;
        },
        onTicketRemove: () => {
            ticket = undefined;
        }
    };
    const cfg = {
        "accessTokenUrl": "https://home.mozu.com/api/platform/applications/authtickets/oauth",
        "clientId": "d4e9bb5.cmcmannus.1.0.0.Release",
        "sharedSecret": "20feabf08fb14e0b86fb5335f98661ce",
        "apiHost": "https://t30295-s50528.sandbox.mozu.com"
    };
    try {
        const apolloClient = _1.CreateApolloClient({
            api: cfg,
            clientAuthHooks
        });
        const results = await apolloClient.query({
            query: graphql_tag_1.default `
        query GetProducts {
          products {
            items {
              content {
                productName
              }
            }
          }
        }
      `
        });
        console.log(results);
    }
    catch (ex) {
        console.log(ex);
    }
})();
//# sourceMappingURL=test.js.map