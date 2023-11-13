const hre = require('hardhat');
const { upgrades } = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {

  if (!process.env.TREASURE_ADDRESS) {
    throw new Error('env TREASURE_ADDRESS not set');
  }

  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;

  const contract = await hre.ethers.getContractFactory('DomainRegistry');

  const deploy = await upgrades.deployProxy(contract, [mainPrice, process.env.TREASURE_ADDRESS, paymentPeriod]);
  await deploy.waitForDeployment();

  console.log(
    `CONTRACT_ADDRESS=${await deploy.getAddress()}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
