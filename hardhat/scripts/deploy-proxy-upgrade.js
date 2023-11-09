const hre = require('hardhat');
const { upgrades } = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('env CONTRACT_ADDRESS not set');
  }
  const contractV2 = await hre.ethers.getContractFactory('DomainRegistryV2');

  const deploy = await upgrades.upgradeProxy(process.env.CONTRACT_ADDRESS, contractV2);
  await deploy.waitForDeployment();

  console.log('Done!');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
