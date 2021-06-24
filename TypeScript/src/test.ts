import gql from 'graphql-tag';
import { CreateApolloClient } from '.';
import { UserAuthTicket } from './lib/AuthClient';
const addToCurrentCartQuery = gql`
mutation addToCart($productToAdd:CartItem_Input!){
    addItemToCurrentCart(cartItem_Input: $productToAdd) {
      id
    }
}`
const currentCartQuery = gql`
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
`
function buildAddToCartVariables(productCode="", quantity=1) {
  return {
      productToAdd: { 
        product:
            {
                isTaxable: true,
                isRecurring: false,
                productCode: productCode,
                isPackagedStandAlone: true
            },
            quantity:quantity,
            fulfillmentMethod:"Ship"
        }
    }
}
(async function() {
  let rawTicket: string = "";
  let ticket: UserAuthTicket | undefined = undefined;
  let clientAuthHooks = {
    onTicketChange: (authTicket: UserAuthTicket) => {
      if (!ticket || ticket.accessToken !== authTicket.accessToken) {
        ticket = authTicket;
      }
    },
    onTicketRead: () => {
      if(!ticket){
        console.log('no ticket')
      }
      return ticket as UserAuthTicket;
    },
    onTicketRemove: () => {
      ticket = undefined;
    }
  }
  const at_url = "https://home.dev07.kubedev.kibo-dev.com/api/platform/applications/authtickets/oauth"
  const cfg = {
    "accessTokenUrl": at_url,
    "clientId": "mozuadmin.mpoc_app.1.0.0.Release",
    "sharedSecret": "1d16d7d35b8542cba2f99216f20dca32",
    "apiHost": "https://t17194-s21127.dev07.kubedev.kibo-dev.com/"
  }
  try{
    const apolloClient = CreateApolloClient({
      api: cfg,
      clientAuthHooks
    });
    const results = await apolloClient.query({
      query: gql`
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
    })
    const productCode = results?.data?.products?.items[0]?.productCode
    const addToCartResp = await apolloClient.mutate({
      mutation: addToCurrentCartQuery,
      variables: buildAddToCartVariables(productCode)
    })
    const currentCart = await apolloClient.query({
      query: currentCartQuery
    })
    console.log(currentCart)
  } catch (ex) {
    console.log(ex);
  }
})()