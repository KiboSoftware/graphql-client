"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const _1 = require(".");
(async function () {
    var _a, _b;
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
        console.log((_b = (_a = results === null || results === void 0 ? void 0 : results.data) === null || _a === void 0 ? void 0 : _a.products) === null || _b === void 0 ? void 0 : _b.items);
    }
    catch (ex) {
        console.log(ex);
    }
})();
//# sourceMappingURL=test.js.map