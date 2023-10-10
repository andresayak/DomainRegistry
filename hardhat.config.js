require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');

const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/../.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.19',
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk'
      }
    }
  }
};
