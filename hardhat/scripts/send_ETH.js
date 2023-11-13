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

  const value = ethers.parseEther(response.amount);
  const recipient = response.recipient;

  await new Promise((done) => {
    new Confirm(`Transfer ${ethers.formatEther(value)} ETH to ${recipient}?`).ask(async (answer) => {
      if (answer) {
        const tx = await owner.sendTransaction({
          to: recipient,
          value,
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
