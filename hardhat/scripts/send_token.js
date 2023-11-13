const { ethers } = require('hardhat');
const Confirm = require('prompt-confirm');
const prompts = require('prompts');

async function main() {
  const [owner] = await ethers.getSigners();
  console.log('Account: ' + owner.address);
  console.log('ETH Balance: ' + ethers.formatEther(await ethers.provider.getBalance(owner.address)));

  const questions = [
    {
      type: 'text',
      name: 'tokenAddress',
      message: 'What is token address?',
    },
    {
      type: 'text',
      name: 'amount',
      message: 'What is amount?',
    },
    {
      type: 'text',
      name: 'recipient',
      message: 'Why recipient?',
    },
  ];

  const response = await prompts(questions);

  const contractName = 'TestToken';

  const tokenContract = await ethers.getContractAt(contractName, response.tokenAddress);
  const tokenSymbol = await tokenContract.symbol();

  const amount = ethers.parseUnits(response.amount, 18);
  const recipient = response.recipient;

  await new Promise((done) => {
    new Confirm(`Transfer ${ethers.formatEther(amount)} ${tokenSymbol} to ${recipient}?`).ask(async (answer) => {
      if (answer) {
        const tx = await tokenContract.transfer(recipient, amount, {
          gasLimit: 300000,
        });
        console.log(`Transfer tx ${tx.hash}`);
        await tx.wait();
        console.log('Done!');
      }
      done(answer);
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
