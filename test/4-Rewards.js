const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { successReserveDomainV2 } = require('./utils');

describe('Rewards', function () {
  let contract, owner, otherAccount, treasure;
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;

  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory('DomainRegistry');
    const deploy = await upgrades.deployProxy(Contract, [mainPrice, treasure.address, paymentPeriod]);
    await deploy.waitForDeployment();
    const contractAddress = await deploy.getAddress();
    contract = await ethers.getContractAt('DomainRegistry', contractAddress, owner);

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  it('Should reserve top domain and make 100% reward for treasure of mainPrice', async function () {
    const periods = 1;
    const domain = 'aaa';
    const cost = mainPrice * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: mainPrice,
      }),
    ).not.to.be.reverted;

    expect(await contract.rewards(treasure.address)).to.equal(cost);

    const tx1 = contract.connect(owner).withdrawReward();
    await expect(tx1).to.be.reverted;

    const tx2 = contract.connect(treasure).withdrawReward();
    await expect(tx2).not.to.be.reverted;
    await expect(tx2).to.changeEtherBalance(contract, -cost);
    await expect(tx2).to.changeEtherBalance(treasure, cost);
  });

  it('Should revert if send wrong value', async function () {
    const fee = 7; //7%
    await expect(contract.setFee(fee)).not.to.be.reverted;

    const additionalPrice = 100;
    const parentDomain = 'com';
    await successReserveDomainV2({ contract, periods: 1, mainPrice, domain: parentDomain, additionalPrice });

    const periods = 10;

    const domain = 'aaa.' + parentDomain;

    const subdomainCost = (mainPrice + additionalPrice) * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: subdomainCost - 1,
      }),
    ).to.be.reverted;
  });

  it('Should reserve sub domain and get 7% reward of additional price', async function () {
    const fee = 7; //7%
    await expect(contract.setFee(fee)).not.to.be.reverted;

    const additionalPrice = 100;
    const parentDomain = 'com';
    await successReserveDomainV2({ contract, periods: 1, mainPrice, domain: parentDomain, additionalPrice });
    const parentCost = mainPrice;

    const periods = 10;

    const domain = 'aaa.' + parentDomain;

    const subdomainCost = (mainPrice + additionalPrice) * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: subdomainCost,
      }),
    ).not.to.be.reverted;

    const domainOwnerReward = additionalPrice * periods * (100 - fee) / 100;
    const treasureReward = parentCost + subdomainCost - domainOwnerReward;
    expect(await contract.rewards(owner.address)).to.equal(domainOwnerReward);
    expect(await contract.rewards(treasure.address)).to.equal(treasureReward);

    const tx1 = contract.connect(owner).withdrawReward();
    await expect(tx1).not.to.be.reverted;
    await expect(tx1).to.changeEtherBalance(contract, -domainOwnerReward);
    await expect(tx1).to.changeEtherBalance(owner, domainOwnerReward);

    const tx2 = contract.connect(treasure).withdrawReward();
    await expect(tx2).not.to.be.reverted;
    await expect(tx2).to.changeEtherBalance(contract, -treasureReward);
    await expect(tx2).to.changeEtherBalance(treasure, treasureReward);
  });

  it('Should reserve sub domain and make 100% reward for treasure of mainPrice', async function () {
    const fee = 7; //7%
    await expect(contract.setFee(fee)).not.to.be.reverted;

    const additionalPrice = 0;
    const parentDomain = 'com';
    await successReserveDomainV2({ contract, periods: 1, mainPrice, domain: parentDomain, additionalPrice });
    const parentCost = mainPrice;

    const periods = 10;

    const domain = 'aaa.' + parentDomain;

    const subdomainCost = (mainPrice + additionalPrice) * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: subdomainCost,
      }),
    ).not.to.be.reverted;

    const domainOwnerReward = additionalPrice * periods * (100 - fee) / 100;
    const treasureReward = parentCost + subdomainCost - domainOwnerReward;
    expect(await contract.rewards(owner.address)).to.equal(domainOwnerReward);
    expect(await contract.rewards(treasure.address)).to.equal(treasureReward);

    const tx1 = contract.connect(owner).withdrawReward();
    await expect(tx1).to.be.reverted;

    const tx2 = contract.connect(treasure).withdrawReward();
    await expect(tx2).not.to.be.reverted;
    await expect(tx2).to.changeEtherBalance(contract, -treasureReward);
    await expect(tx2).to.changeEtherBalance(treasure, treasureReward);
  });
});
