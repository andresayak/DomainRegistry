const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { successReserveDomainV2 } = require('./utils');

describe('Rewards', function () {
  let contract, owner, otherAccount, treasure;
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;

  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('DomainRegistry')).deploy();
    await contract.waitForDeployment();
    await contract.initialize(mainPrice, treasure.address, paymentPeriod);

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  it('Should reserve top domain and make 100% reward for treasure', async function () {
    const periods = 1;
    const domain = 'aaa';
    const cost = mainPrice * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: mainPrice,
      }),
    ).not.to.be.reverted;

    expect(await contract.rewards(treasure.address)).to.equal(cost);

    const tx = contract.connect(treasure).withdrawReward();
    await expect(tx).not.to.be.reverted;
    await expect(tx).to.changeEtherBalance(contract, -cost);
    await expect(tx).to.changeEtherBalance(treasure, cost);
  });

  it('Should reserve sub domain and get 7% reward for domain owner', async function () {
    const fee = 7; //7%
    await expect(contract.setFee(fee)).not.to.be.reverted;

    const parentDomain = 'com';
    await successReserveDomainV2({ contract, periods: 1, mainPrice, domain: parentDomain });
    const parentCost = mainPrice;

    const periods = 10;
    const domain = 'aaa.' + parentDomain;

    const subdomainCost = mainPrice * periods;
    await expect(
      contract.reserveDomain(domain, periods, 0, {
        value: subdomainCost,
      }),
    ).not.to.be.reverted;

    const domainOwnerReward = (subdomainCost * fee) / 100;
    const treasureReward = parentCost + subdomainCost - domainOwnerReward;
    expect(await contract.rewards(owner.address)).to.equal(domainOwnerReward);
    expect(await contract.rewards(treasure.address)).to.equal(treasureReward);

    const tx = contract.connect(owner).withdrawReward();
    await expect(tx).not.to.be.reverted;
    await expect(tx).to.changeEtherBalance(contract, -domainOwnerReward);
    await expect(tx).to.changeEtherBalance(owner, domainOwnerReward);
  });
});
