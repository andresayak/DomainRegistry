const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { successReserveDomain } = require('./utils');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

describe('Payments and Rewards in Tokens', function () {
  let contract, owner, otherAccount, treasure;
  let tokenA, tokenB, tokenC;
  let feedETHUSD, feedA, feedB;
  const mainPrice = 50n;
  const decimalsMain = 18;
  const mainPriceBN = mainPrice * BigInt(10 ** decimalsMain);
  const paymentPeriod = 365 * 3600 * 24;

  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();
    const tokenContract = await ethers.getContractFactory('TestToken');

    const feedContract = await ethers.getContractFactory('Aggregator');

    //feedETHUSD = await ethers.getContractAt('Aggregator', '0x694AA1769357215DE4FAC081bf1f309aDC325306');
    //feedBTCUSD = await ethers.getContractAt('Aggregator', '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43');
    tokenA = await tokenContract.deploy('Token A', 'BBB', BigInt(1_000_000) * BigInt(10 ** 18));
    tokenB = await tokenContract.deploy('Token B', 'BBB', BigInt(1_000_000) * BigInt(10 ** 18));
    tokenC = await tokenContract.deploy('Token C', 'CCC', BigInt(1_000_000) * BigInt(10 ** 18));

    feedA = await feedContract.deploy(BigInt(18_420_605_448_220_960_000), 18); //~18.42 USD
    feedB = await feedContract.deploy(2n * BigInt(10 ** 18), 18); //2 USD
    feedETHUSD = await feedContract.deploy(1900n * BigInt(10 ** 18), 18); //1900 USD

    const Contract = await ethers.getContractFactory('DomainRegistry');
    contract = await upgrades.deployProxy(Contract, [mainPriceBN, treasure.address, paymentPeriod]);
    await contract.waitForDeployment();

    contract = await upgrades.upgradeProxy(await contract.getAddress(), Contract, {
      call: {
        fn: 'initializeV3',
        args: [
          mainPriceBN,
          await feedETHUSD.getAddress(),
          [await tokenA.getAddress(), await tokenB.getAddress()],
          [await feedA.getAddress(), await feedB.getAddress()],
        ],
      },
    });
    await contract.waitForDeployment();

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  it('check NATIVE token price', async function () {
    const periodsA = 10n;

    const feedResult = await feedETHUSD.latestRoundData();
    const decimals = await feedETHUSD.decimals();
    const cost = await contract.getPriceInEth(mainPriceBN * periodsA);
    expect(cost).to.equal((mainPriceBN * periodsA * 10n ** decimals) / feedResult[1]);
  });

  it('check ERC20 token price', async function () {
    const periodsA = 3n;

    const [, priceA] = await feedA.latestRoundData();
    const costA = await contract.getPriceInToken(await tokenA.getAddress(), mainPriceBN * periodsA);
    const decimalsA = await feedA.decimals();
    expect(costA).to.equal((periodsA * mainPriceBN * 10n ** decimalsA) / priceA);

    const periodsB = 12n;
    const [, priceB] = await feedB.latestRoundData();
    const decimalsB = await feedB.decimals();
    const costB = await contract.getPriceInToken(await tokenB.getAddress(), mainPriceBN * periodsB);
    expect(costB).to.equal((periodsB * mainPriceBN * 10n ** decimalsB) / priceB);
    await expect(contract.getPriceInToken(await tokenC.getAddress(), 1)).to.revertedWith('token not in whitelist');
  });

  it('Should reserve top domain and make 100% reward for treasure', async function () {
    const tokenAddress = await tokenA.getAddress();
    const periods = 1n;
    const domain = 'aaa';
    const cost = await contract.getPriceInToken(tokenAddress, mainPriceBN * periods);
    await expect(tokenA.approve(await contract.getAddress(), cost)).not.to.reverted;
    await expect(contract.reserveDomainByToken(domain, periods, tokenAddress, 0)).not.to.reverted;

    expect(await contract.rewardByToken(treasure.address, tokenAddress)).to.equal(cost);

    const tx = contract.withdrawRewardToken(treasure.address, tokenAddress);
    await expect(tx).not.to.reverted;
    await expect(tx).to.changeTokenBalance(tokenA, contract, -cost);
    await expect(tx).to.changeTokenBalance(tokenA, treasure, cost);
  });

  it('Should reserve sub domain and get 7% right fee from additional cost', async function () {
    const tokenAddress = await tokenA.getAddress();
    const fee = 7n; //7%
    await expect(contract.setFee(fee)).not.to.reverted;

    const additionalPrice = mainPriceBN;

    const parentDomain = 'com';
    await successReserveDomain({
      contract,
      periods: 1n,
      mainPrice: mainPriceBN,
      domain: parentDomain,
      additionalPrice,
    });

    const periods = 10n;
    const domain = 'aaa.' + parentDomain;

    const baseCost = await contract.getPriceInToken(tokenAddress, (mainPriceBN) * periods);
    const additionalCost = await contract.getPriceInToken(tokenAddress, (additionalPrice) * periods);
    const totalCost = baseCost + additionalCost;
    await expect(tokenA.transfer(otherAccount.address, totalCost)).not.to.reverted;

    expect(await tokenA.balanceOf(otherAccount.address)).to.equal(totalCost);
    await expect(tokenA.connect(otherAccount).approve(await contract.getAddress(), totalCost)).not.to.reverted;

    const createdAt = (await helpers.time.latest()) + 1;
    const finishedAt = BigInt(createdAt) + BigInt(paymentPeriod) * periods;

    const tx1 = contract.connect(otherAccount).reserveDomainByToken(domain, periods, tokenAddress, additionalPrice);
    await expect(tx1).not.to.reverted;

    const feeCost = additionalCost * fee / 100n
    const subdomainParentReward = (totalCost - baseCost - feeCost);
    const treasureReward = feeCost + baseCost;

    await expect(tx1)
      .to.emit(contract, 'DomainReserved')
      .withArgs(otherAccount.address, domain, domain, additionalPrice, createdAt, finishedAt);

    await expect(tx1).to.emit(contract, 'RewardAddedToken').withArgs(treasure.address, tokenAddress, treasureReward);
    await expect(tx1).to.emit(contract, 'RewardAddedToken').withArgs(owner.address, tokenAddress, subdomainParentReward);
    expect(await contract.rewardByToken(owner.address, tokenAddress)).to.equal(subdomainParentReward);
    expect(await contract.rewardByToken(treasure.address, tokenAddress)).to.equal(treasureReward);

    const tx2 = contract.connect(otherAccount).withdrawRewardToken(owner.address, tokenAddress);
    await expect(tx2).not.to.reverted;
    await expect(tx2).to.changeTokenBalance(tokenA, contract, -subdomainParentReward);
    await expect(tx2).to.changeTokenBalance(tokenA, owner, subdomainParentReward);

    const tx3 = contract.connect(otherAccount).withdrawRewardToken(treasure.address, tokenAddress);
    await expect(tx3).not.to.reverted;
    await expect(tx3).to.changeTokenBalance(tokenA, contract, -treasureReward);
    await expect(tx3).to.changeTokenBalance(tokenA, treasure, treasureReward);

    expect(await contract.rewardByToken(owner.address, tokenAddress)).to.equal(0);
    expect(await contract.rewardByToken(treasure.address, tokenAddress)).to.equal(0);
  });
});
