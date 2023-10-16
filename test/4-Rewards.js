const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { successReserveDomain } = require('./utils');
const hre = require('hardhat');

describe('DomainRegistry V2', function () {
  let contract, owner, otherAccount, treasure;
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;
  const fee = 7; //7%
  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();
    const contractV1 = await hre.ethers.getContractFactory('DomainRegistry');
    const deploy = await upgrades.deployProxy(contractV1, [mainPrice, treasure.address, paymentPeriod]);
    await deploy.waitForDeployment();

    const contractAddress = await deploy.getAddress();

    const contractV2 = await hre.ethers.getContractFactory('DomainRegistryV2');

    const deployV2 = await upgrades.upgradeProxy(contractAddress, contractV2);
    await deployV2.waitForDeployment();

    contract = await hre.ethers.getContractAt('DomainRegistryV2', contractAddress, owner);

    await expect(contract.setFee(fee)).not.to.be.reverted;
    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Adding domain', function () {
    it('Should reserve top domain and make 100% reward for treasure', async function() {
      const periods = 1;
      const domain = 'aaa';
      const cost = mainPrice * periods;
      await expect(contract.reserveDomain(domain, periods, {
        value: mainPrice,
      })).not.to.be.reverted;

      expect(await contract.rewards(treasure.address)).to.equal(cost);

      const tx = contract.connect(treasure).withdrawReward();
      await expect(tx).not.to.be.reverted;
      await expect(tx).to.changeEtherBalance(contract, -cost);
      await expect(tx).to.changeEtherBalance(treasure, cost);
    });

    it('Should reserve sub domain and get 10% reward for domain owner', async function() {

      const parentDomain = 'com';
      await successReserveDomain({contract, periods: 1, mainPrice, domain: parentDomain});
      const parentCost = mainPrice;

      const periods = 10;
      const domain = 'aaa.'+parentDomain;

      const subdomainCost = mainPrice * periods;
      await expect(contract.reserveDomain(domain, periods, {
        value: subdomainCost,
      })).not.to.be.reverted;

      const domainOwnerReward = subdomainCost * fee / 100;
      const treasureReward = parentCost + subdomainCost - domainOwnerReward;
      expect(await contract.rewards(owner.address)).to.equal(domainOwnerReward);
      expect(await contract.rewards(treasure.address)).to.equal(treasureReward);

      const tx = contract.connect(owner).withdrawReward();
      await expect(tx).not.to.be.reverted;
      await expect(tx).to.changeEtherBalance(contract, -domainOwnerReward);
      await expect(tx).to.changeEtherBalance(owner, domainOwnerReward);
    });
  });
});
