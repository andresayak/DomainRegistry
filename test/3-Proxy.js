const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { successReserveDomain } = require('./utils');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const hre = require('hardhat');
const { abi: abiV1, bytecode: bytecodeV1 } = require('./data/DomainRegistryV1-2.json');

describe('Smoke test after upgrade', function () {
  let contract, owner, otherAccount, treasure;
  let actionBeforeUpgrade = async () => {};
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;

  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();
    const contractV1 = new hre.ethers.ContractFactory(abiV1, bytecodeV1, owner);
    const deploy = await upgrades.deployProxy(contractV1, [mainPrice, treasure.address, paymentPeriod]);
    await deploy.waitForDeployment();

    const contractAddress = await deploy.getAddress();

    contract = await hre.ethers.getContractAt(abiV1, contractAddress, owner);

    await actionBeforeUpgrade();

    const contractV2 = await hre.ethers.getContractFactory('DomainRegistry');

    const deployV2 = await upgrades.upgradeProxy(contractAddress, contractV2);
    await deployV2.waitForDeployment();

    contract = await hre.ethers.getContractAt('DomainRegistry', contractAddress, owner);

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));
  afterEach(() => {
    actionBeforeUpgrade = async () => {};
  });

  describe('Check initializer', function () {
    actionBeforeUpgrade = async () => {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'com' });
    };
    it('Should revert if call initialize second time', async function () {
      await expect(contract.initialize(mainPrice, treasure.address, paymentPeriod)).to.reverted;
    });
  });

  describe('Check main params after upgrade', function () {
    actionBeforeUpgrade = async () => {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'com' });
    };
    it('Should get the right main payment amount per one year', async function () {
      expect(await contract.mainPrice()).to.equal(mainPrice);
    });
    it('Should get the right treasure address', async function () {
      expect(await contract.treasure()).to.equal(treasure.address);
    });
    it('Should get the right payment period address', async function () {
      expect(await contract.paymentPeriod()).to.equal(paymentPeriod);
    });
  });

  describe('Adding domain before upgrade', function () {
    const domain = 'com';
    const years = 1;
    let createdAt;
    actionBeforeUpgrade = async () => {
      createdAt = (await helpers.time.latest()) + 1;
      await helpers.time.setNextBlockTimestamp(createdAt);
      await successReserveDomain({ contract, periods: years, mainPrice, domain });
      await successReserveDomain({ contract, periods: years, mainPrice, domain: 'aaa.' + domain });
      await successReserveDomain({ contract, periods: years, mainPrice, domain: 'bbb.aaa.' + domain });
    };
    it('Should get the right information about domain', async function () {
      const finishedAt = createdAt + paymentPeriod * years;

      expect(await contract.isFreeDomain(domain)).to.be.false;
      expect(await contract.domainOwner(domain)).to.equal(owner.address);
      const [, createdAtCheck, finishedAtCheck, additionalPriceCheck] = await contract.domainInfo(domain);
      expect(createdAtCheck).to.be.equal(createdAt);
      expect(finishedAtCheck).to.be.equal(finishedAt);
      expect(additionalPriceCheck).to.be.equal(0);
    });
  });
});
