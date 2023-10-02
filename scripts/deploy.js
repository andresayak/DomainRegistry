const hre = require('hardhat');

async function main() {
  const lockedAmount = hre.ethers.parseEther('0.001');

  const contract = await hre.ethers.deployContract('DomainRegistry', [lockedAmount]);

  await contract.waitForDeployment();

  console.log(
    `Contract deployed to ${contract.target}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
