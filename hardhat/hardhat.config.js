require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');
require('@openzeppelin/hardhat-upgrades');

const {config: dotEnvConfig} = require('dotenv');
dotEnvConfig({path: __dirname + '/.env'});

const mnemonic = process.env.MNEMONIC || 'test test test test test test test test test test test junk';

const accounts = {
  mnemonic,
  path: 'm/44\'/60\'/0\'/0',
  initialIndex: 0
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
  networks: {
    hardhat: {
      accounts
      //forking: {
      //  url: process.env.ETHEREUM_SEPOLIA_PROVIDER_URL
      //}
    },
    ethereum_sepolia: {
      chainId: 11155111,
      url: process.env.ETHEREUM_SEPOLIA_PROVIDER_URL || 'https://ethereum-sepolia.publicnode.com',
      accounts
    }
  }
};
