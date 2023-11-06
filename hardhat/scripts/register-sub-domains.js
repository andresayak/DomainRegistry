const hre = require('hardhat');
const { ethers } = require('hardhat');
const { config: dotEnvConfig } = require('dotenv');

dotEnvConfig({ path: __dirname + '/.env' });

async function main() {
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('env CONTRACT_ADDRESS not set');
  }

  [_, user] = await ethers.getSigners();

  const mainPrice = BigInt(50 * 10 ** 18);

  const contract = await hre.ethers.getContractAt('DomainRegistry', process.env.CONTRACT_ADDRESS, user);

  for (const [domain, periods, additionalPrice] of [
    ['aaa.com', 1, 0],
    ['bbb.com', 12, 10],
    ['ccc.com', 2, 12.5],
    ['ddd.com', 3, 0.99],
  ]) {
    try {
      const tx = await contract.reserveDomain(domain, periods, BigInt(additionalPrice * 10 ** 18), {
        value: mainPrice * BigInt(periods),
      });
      await tx.wait();

      console.log(`tx=${await tx.hash}`);
    } catch (e) {
      console.error(e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
