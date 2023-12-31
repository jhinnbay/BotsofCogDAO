import type { AppProps } from "next/app";
import { ThirdwebProvider, coinbaseWallet, metamaskWallet, rainbowWallet, walletConnect } from "@thirdweb-dev/react";
import { Polygon } from "@thirdweb-dev/chains";
import "../styles/globals.css";
import { ThirdwebNftMedia, useContract, useNFTs, useContractMetadata } from "@thirdweb-dev/react";
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';

function MyApp({ Component, pageProps }: AppProps) {
  const client = new ApolloClient({
    uri: 'https://hub.snapshot.org/graphql',
    cache: new InMemoryCache(),
  });

  return (
    <ApolloProvider client={client}>
      <ThirdwebProvider 
        supportedWallets={[coinbaseWallet(), metamaskWallet(), rainbowWallet(), walletConnect()]}
        activeChain="polygon" 
        clientId="09bddeb436c778006bbfb6c89c8bf588" // You can get a client id from dashboard settings
      >
        <Component {...pageProps} />
      </ThirdwebProvider>
    </ApolloProvider>
  );
}

export default MyApp;
