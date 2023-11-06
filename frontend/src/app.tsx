import Routes from './routes/Routes';
import { Provider } from 'react-redux';
import store from './store';
import { ToastContainer } from 'react-toastify';
import { BSC, BSCTestnet, Config, DAppProvider, Hardhat } from '@usedapp/core';
import { MetamaskConnector, CoinbaseWalletConnector } from '@usedapp/core';

export const readOnlyUrls: { [k: number]: string } = {
  [BSC.chainId]: process.env.BSCMAINNET_PROVIDER_URL as string,
  [BSCTestnet.chainId]: process.env.BSCTESTNET_PROVIDER_URL as string,
  [Hardhat.chainId]: process.env.HARDHAT_PROVIDER_URL as string,
};

export const tokenLists = {
  [BSC.chainId]: '',
  [BSCTestnet.chainId]: '',
  [Hardhat.chainId]: '',
};
export const allowNetworks = [Hardhat, BSC, BSCTestnet];

export const dappConfig: Config = {
  readOnlyChainId: Hardhat.chainId,
  readOnlyUrls,
  connectors: {
    metamask: new MetamaskConnector(),
    coinbase: new CoinbaseWalletConnector(),
  },
  networks: allowNetworks,
};

export function App() {
  return (
    <Provider store={store}>
      <DAppProvider config={dappConfig}>
        <Routes />
        <ToastContainer />
      </DAppProvider>
    </Provider>
  );
}

export default App;
