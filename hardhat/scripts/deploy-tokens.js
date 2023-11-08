const hre = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {
  const addresses = [];
  for (const symbol of ['LINK', 'BTC', 'CZK']) {
    const totalSupply = BigInt(1_000_000 * (10 ** 18));

    const contract = await hre.ethers.getContractFactory('TestToken');

    const deploy = await contract.deploy('Test Token ' + symbol, symbol, totalSupply);
    await deploy.waitForDeployment();
    addresses.push(await deploy.getAddress());
  }
  console.log(`TOKEN_ADDRESSES=${addresses.join(',')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
