"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const _1 = require(".");
const fs_1 = __importDefault(require("fs"));
const addToCurrentCartQuery = graphql_tag_1.default `
mutation addToCart($productToAdd:CartItem_Input!){
    addItemToCurrentCart(cartItem_Input: $productToAdd) {
      id
    }
}`;
const currentCartQuery = graphql_tag_1.default `
query GetCurrentCart {
    cart: currentCart {
      id
      total
      userId
      items {
        id
        total
        product {
          productCode
          name
          imageUrl
        }
      }
    }
  }
`;
function buildAddToCartVariables(productCode = "", quantity = 1) {
    return {
        productToAdd: {
            product: {
                isTaxable: true,
                isRecurring: false,
                productCode: productCode,
                isPackagedStandAlone: true
            },
            quantity: quantity,
            fulfillmentMethod: "Ship"
        }
    };
}
let ticket = undefined;
function readLocalTicket() {
    if (fs_1.default.existsSync('access_token.json')) {
        let localTicket = fs_1.default.readFileSync('access_token.json', 'utf8');
        if (localTicket)
            ticket = JSON.parse(localTicket);
    }
}
(async function () {
    var _a, _b, _c;
    readLocalTicket();
    let clientAuthHooks = {
        onTicketChange: (authTicket) => {
            if (!ticket || ticket.accessToken !== authTicket.accessToken) {
                ticket = authTicket;
                fs_1.default.writeFileSync('access_token.json', JSON.stringify(authTicket));
            }
        },
        onTicketRead: () => {
            if (!ticket) {
                readLocalTicket();
            }
            return ticket;
        },
        onTicketRemove: () => {
            ticket = undefined;
            fs_1.default.rmSync('access_token.json');
        }
    };
    const at_url = "https://home.dev07.kubedev.kibo-dev.com/api/platform/applications/authtickets/oauth";
    const cfg = {
        "accessTokenUrl": at_url,
        "clientId": "mozuadmin.mpoc_app.1.0.0.Release",
        "sharedSecret": "1d16d7d35b8542cba2f99216f20dca32",
        "apiHost": "https://t17194-s21127.dev07.kubedev.kibo-dev.com/"
    };
    try {
        const apolloClient = _1.CreateApolloClient({
            api: cfg,
            clientAuthHooks
        });
        apolloClient.loginCustomerAndSetAuthTicket({
            username: 'colemcmannus@gmail.com',
            password: 'Kibo1!'
        });
        const results = await apolloClient.query({
            query: graphql_tag_1.default `
        query GetProducts {
          products {
            items {
              productCode
              content {
                productName
              }
            }
          }
        }
      `
        });
        const productCode = (_c = (_b = (_a = results === null || results === void 0 ? void 0 : results.data) === null || _a === void 0 ? void 0 : _a.products) === null || _b === void 0 ? void 0 : _b.items[0]) === null || _c === void 0 ? void 0 : _c.productCode;
        const addToCartResp = await apolloClient.mutate({
            mutation: addToCurrentCartQuery,
            variables: buildAddToCartVariables(productCode)
        });
        const currentCart = await apolloClient.query({
            query: currentCartQuery
        });
        console.log(currentCart);
    }
    catch (ex) {
        console.log(ex);
    }
})();
//# sourceMappingURL=test.js.map