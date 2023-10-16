const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { successReserveDomain, ZERO_ADDRESS } = require('./utils');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const hre = require('hardhat');

describe('DomainRegistry V2', function () {
  let contract, owner, otherAccount, treasure;
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;

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

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Main payment amount', function () {
    it('Should fail is call initialize second time', async function () {
      await expect(contract.initialize(mainPrice, treasure.address, paymentPeriod)).to.be.reverted;
    });
  });

  describe('Main payment amount', function () {
    it('Should set the right main payment amount per one year', async function () {
      expect(await contract.mainPrice()).to.equal(mainPrice);
    });
    it('Should set the new right main payment amount amount per one year', async function () {
      const newMainPrice = mainPrice + 1;
      await expect(contract.changeMainPrice(newMainPrice)).to.emit(contract, 'MainPriceChanged').withArgs(newMainPrice);
      expect(await contract.mainPrice()).to.equal(newMainPrice);
    });
    it('Should revert if call not owner', async function () {
      const newMainPrice = mainPrice + 1;
      await expect(contract.connect(otherAccount).changeMainPrice(newMainPrice)).to.reverted;
    });
  });

  describe('Treasure address', function () {
    it('Should set the new treasure address', async function () {
      const newAddress = otherAccount.address;
      await expect(contract.changeTreasure(newAddress)).to.emit(contract, 'TreasureChanged').withArgs(newAddress);
      expect(await contract.treasure()).to.equal(newAddress);
    });
    it('Should revert if call not owner', async function () {
      await expect(contract.connect(otherAccount).changeTreasure(otherAccount.address)).to.reverted;
    });
  });

  describe('Payment period', function () {
    it('Should set the new payment period', async function () {
      const newPeriodDuration = 180 * 3600 * 24;
      await expect(contract.changePaymentPeriod(newPeriodDuration)).to.emit(contract, 'PaymentPeriodChanged').withArgs(newPeriodDuration);
      expect(await contract.paymentPeriod()).to.equal(newPeriodDuration);
    });
    it('Should revert if call not owner', async function () {
      const newPeriodDuration = 180 * 3600 * 24;
      await expect(contract.connect(otherAccount).changePaymentPeriod(newPeriodDuration)).to.reverted;
    });
  });

  describe('Adding domain', function () {
    it('Should reserve domain and make reward for treasury', async function () {
      const domain = 'com';

      expect(await contract.isFreeDomain(domain)).to.be.true;

      const years = 5;
      const cost = mainPrice * years;
      const createdAt = await helpers.time.latest() + 1;
      const finishedAt = createdAt + paymentPeriod * years;
      await helpers.time.setNextBlockTimestamp(createdAt);
      const tx = contract.reserveDomain(domain, years, {
        value: cost,
      });
      await expect(tx).to.emit(contract, 'DomainReserved').withArgs(owner.address, domain, cost, createdAt, finishedAt);

      await expect(tx).to.changeEtherBalance(owner, -cost);
      await expect(tx).to.changeEtherBalance(contract, cost);

      expect(await contract.isFreeDomain(domain)).to.be.false;
      expect(await contract.domainOwner(domain)).to.equal(owner.address);
      const [,  createdAtCheck, finishedAtCheck] = await contract.domainInfo(domain);
      expect(createdAtCheck).to.be.equal(createdAt);
      expect(finishedAtCheck).to.be.equal(finishedAt);

    });

    it('Should reserve many domains', async function () {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'aaa' });
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'bbb' });
    });

    it('Should reserve domain with prefix', async function () {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'https://aaa' });
      expect(await contract.domainOwner('https://aaa')).to.equal(ZERO_ADDRESS);
      expect(await contract.domainOwner('aaa')).to.equal(owner.address);
    });

    it('Should reserve domain length more prefix', async function () {
      const domain = 'aaaaaaaaaaaaaaaaaaaa';
      await successReserveDomain({ contract, periods: 1, mainPrice, domain });
      expect(await contract.domainOwner(domain)).to.equal(owner.address);
    });

    it('Should revert with the right error if domain busy', async function () {
      const domain = 'aaa';
      await successReserveDomain({ contract, periods: 1, mainPrice, domain });
      await expect(
        contract.reserveDomain(domain, 1, {
          value: mainPrice,
        }),
      ).to.be.revertedWith('not free domain');
    });

    it('Should revert with the right error if domain empty', async function () {
      const domain = '';

      await expect(
        contract.reserveDomain(domain, 1, {
          value: mainPrice,
        }),
      ).to.be.revertedWith('empty domain');
    });

    it('Should revert with the right error if wrong payment amount', async function () {
      const domain = 'aaa';

      await expect(
        contract.reserveDomain(domain, 1, {
          value: mainPrice - 1,
        }),
      ).to.be.revertedWith('wrong value');
      expect(await contract.isFreeDomain(domain)).to.be.true;
    });
  });

  describe('Continue domain', function () {
    it('You need to renew the domain for another 2 years', async function () {
      const domain = 'aaa';
      await successReserveDomain({ contract, periods: 1, mainPrice, domain });

      const years = 2;
      const cost = mainPrice * years;
      const [, createdAt, prevFinishedAt] = await contract.domainInfo(domain);

      const finishedAt = Number(prevFinishedAt) + paymentPeriod * years;
      const tx = contract.continueDomain(domain, years, {
        value: cost,
      });
      await expect(tx).to.emit(contract, 'DomainContinue').withArgs(owner.address, domain, cost, finishedAt);

      await expect(tx).to.changeEtherBalance(owner, -cost);
      await expect(tx).to.changeEtherBalance(contract, cost);

      expect(await contract.isFreeDomain(domain)).to.be.false;
      expect(await contract.domainOwner(domain)).to.equal(owner.address);
      const [, createdAtCheck, newFinishedAt] = await contract.domainInfo(domain);
      expect(createdAtCheck).to.be.equal(createdAt);
      expect(newFinishedAt).to.be.equal(finishedAt);

    });

    it('Should reserve old domain', async function() {
      const domain = 'aaa';
      await successReserveDomain({ contract, periods: 1, mainPrice, domain });

      const [, , prevFinishedAt] = await contract.domainInfo(domain);
      expect(await contract.isFreeDomain(domain)).to.false;
      const nextBlockTimestamp = Math.max(Number(prevFinishedAt), Number(await helpers.time.latest())) + 1;
      await helpers.time.increaseTo(nextBlockTimestamp);
      await expect(contract.domainInfo(domain)).to.be.revertedWith('free domain');
      expect(await contract.isFreeDomain(domain)).to.true;
      await expect(
        contract.connect(otherAccount).reserveDomain(domain, 1, {
          value: mainPrice,
        }),
      ).not.to.be.reverted;
      expect(await contract.isFreeDomain(domain)).to.be.false;
    });
  });

  describe('Adding sub domain', function () {

    const parentDomain = 'com';

    beforeEach(async () => {
      await successReserveDomain({contract, periods: 1, mainPrice, domain: parentDomain});
    });

    it('Should reserve sub-domain and store the funds to lock', async function() {

      const domain = 'aaa.' + parentDomain;
      expect(await contract.isFreeDomain(domain)).to.be.true;

      const createdAt = await helpers.time.latest() + 1;// Math.ceil(new Date().getTime() / 1000);
      const finishedAt = createdAt + 365 * 3600 * 24;
      await helpers.time.setNextBlockTimestamp(createdAt);

      const tx = contract.reserveDomain(domain, 1, {
        value: mainPrice,
      });
      await expect(tx).to.emit(contract, 'DomainReserved').withArgs(owner.address, domain, mainPrice, createdAt, finishedAt);

      await expect(tx).to.changeEtherBalance(owner, -mainPrice);
      await expect(tx).to.changeEtherBalance(contract, mainPrice);

      expect(await contract.isFreeDomain(domain)).to.be.false;
      expect(await contract.domainOwner(domain)).to.equal(owner.address);
    });

    it('Should revert with the right error if sub-domain busy', async function() {
      const domain = 'aaa.' + parentDomain;
      await successReserveDomain({ contract, periods: 1, mainPrice, domain });
      await expect(
        contract.reserveDomain(domain, 1, {
          value: mainPrice,
        }),
      ).to.be.revertedWith('not free domain');
    });

    it('Should reserve many sub-domains', async function() {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'aaa.' + parentDomain });
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'bbb.aaa.' + parentDomain });
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'ccc.bbb.aaa.' + parentDomain });
    });

    it('Should reserve sub-domain with prefix', async function() {
      await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'https://aaa.' + parentDomain });
    });

    it('Should revert with the right error if parent domain is free', async function() {
      const domain = 'aaa.xxx';

      await expect(
        contract.reserveDomain(domain, 1, {
          value: mainPrice,
        }),
      ).to.be.revertedWith('parent domain is free');
    });
    describe('Sub domains registration', function () {
      const [domain1, domain2, domain3] = ['aaa.'+parentDomain, 'bbb.'+parentDomain, 'ccc.'+parentDomain];

      beforeEach(async () => {
        await successReserveDomain({ contract, periods: 1, mainPrice, domain: domain1 });
        await successReserveDomain({ contract, periods: 1, mainPrice, domain: domain2 });
        await successReserveDomain({ contract, periods: 1, mainPrice, domain: domain3 });
      });
    });
  });
});
