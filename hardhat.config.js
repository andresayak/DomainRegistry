require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');
require('@openzeppelin/hardhat-upgrades');

const { config: dotEnvConfig } = require('dotenv');
dotEnvConfig({ path: __dirname + '/.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.20',
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk';
      }
    }
  }
};
