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

  //const aggregators = process.env.AGGREGATORS_ADDRESSES.split(',');
  //const tx = await contract.initializeV3(mainPrice, aggregators[0], process.env.TOKEN_ADDRESSES.split(','), aggregators);

  const tx = await contract.initializeV3(mainPrice, '0x694AA1769357215DE4FAC081bf1f309aDC325306', process.env.TOKEN_ADDRESSES.split(','), [
    '0x48731cF7e84dc94C5f84577882c14Be11a5B7456',//WETH
    '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',//BTC
    '0xAE45DCb3eB59E27f05C170752B218C6174394Df8',//CZK
  ]);
  await tx.wait();

  console.log(
    `tx=${await tx.hash}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
