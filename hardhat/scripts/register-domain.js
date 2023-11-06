const hre = require('hardhat');
const { ethers } = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {

  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('env CONTRACT_ADDRESS not set');
  }

  [owner] = await ethers.getSigners();

  const mainPrice = BigInt(50 * (10 ** 18));

  const contract = await hre.ethers.getContractAt('DomainRegistry', process.env.CONTRACT_ADDRESS, owner);

  const tx = await contract.reserveDomain('com', 1, 0, {
    value: mainPrice
  });
  await tx.wait();

  console.log(
    `tx=${await tx.hash}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
