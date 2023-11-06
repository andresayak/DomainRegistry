const hre = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {
  const addresses = [];

  for (const [value, decimals] of [
    [0.5, 18],
    [1, 2],
    [59, 6],
  ]) {
    const contract = await hre.ethers.getContractFactory('Aggregator');
    const deploy = await contract.deploy(BigInt(value * 10 ** decimals), decimals);
    await deploy.waitForDeployment();
    addresses.push(await deploy.getAddress());
  }
  console.log(`AGGREGATORS_ADDRESSES=${addresses.join(',')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
