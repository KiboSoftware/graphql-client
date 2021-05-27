import gql from 'graphql-tag';
import { CreateApolloClient } from '.';
import { UserAuthTicket } from './lib/AuthClient';

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
      return ticket as UserAuthTicket;
    },
    onTicketRemove: () => {
      ticket = undefined;
    }
  }

  const cfg = {
    "accessTokenUrl": "https://home.mozu.com/api/platform/applications/authtickets/oauth",
    "clientId": "d4e9bb5.cmcmannus.1.0.0.Release",
    "sharedSecret": "20feabf08fb14e0b86fb5335f98661ce",
    "apiHost": "https://t30295-s50528.sandbox.mozu.com"
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
              content {
                productName
              }
            }
          }
        }
      `
    })

    console.log(results);
  } catch (ex) {
    console.log(ex);
  }
})()
