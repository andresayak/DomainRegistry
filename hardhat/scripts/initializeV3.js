const hre = require('hardhat');
const { ethers } = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {

  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('env CONTRACT_ADDRESS not set');
  }
  if (!process.env.TOKEN_ADDRESSES) {
    throw new Error('env TOKEN_ADDRESSES not set');
  }
  if (!process.env.AGGREGATORS_ADDRESSES) {
    throw new Error('env AGGREGATORS_ADDRESSES not set');
  }

  const [owner] = await ethers.getSigners();

  const mainPrice = BigInt(50 * (10 ** 18));

  const contract = await hre.ethers.getContractAt('DomainRegistry', process.env.CONTRACT_ADDRESS, owner);

  console.log(mainPrice, process.env.TOKEN_ADDRESSES.split(','), process.env.AGGREGATORS_ADDRESSES.split(','));
  const tx = await contract.initializeV3(mainPrice, '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    process.env.TOKEN_ADDRESSES.split(','), process.env.AGGREGATORS_ADDRESSES.split(','));
  await tx.wait();

  console.log(
    `tx=${await tx.hash}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
