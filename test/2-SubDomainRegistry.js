const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { successReserveDomain } = require('./utils');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

describe('Adding sub domain', function () {
  let contract, owner, otherAccount, treasure;
  const mainPrice = 1_000_000_000;
  const paymentPeriod = 365 * 3600 * 24;
  const parentDomain = 'com';

  const deployContract = async () => {
    [owner, otherAccount, treasure] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('DomainRegistry')).deploy();
    await contract.initialize(mainPrice, treasure.address, paymentPeriod);

    return { contract, mainPrice, owner, otherAccount };
  };

  beforeEach(async () => {
    await loadFixture(deployContract);
    await successReserveDomain({contract, periods: 1, mainPrice, domain: parentDomain});
  });

  it('Should reserve sub-domain and store the funds to lock', async function () {

    const domain = 'aaa.'+parentDomain;
    expect(await contract.isFreeDomain(domain)).to.be.true;

    const createdAt = await helpers.time.latest() + 1;// Math.ceil(new Date().getTime() / 1000);
    const finishedAt = createdAt + 365 * 3600 * 24;
    await helpers.time.setNextBlockTimestamp(createdAt);

    const tx = contract.reserveDomain(domain, 1, {
      value: mainPrice,
    });
    await expect(tx).to.emit(contract, 'DomainReserved').withArgs(owner.address, domain, mainPrice, createdAt, finishedAt);

    await expect(tx).to.changeEtherBalance(owner, -mainPrice);
    await expect(tx).to.changeEtherBalance(treasure, mainPrice);

    expect(await contract.isFreeDomain(domain)).to.be.false;
    expect(await contract.domainOwner(domain)).to.equal(owner.address);
  });

  it('Should revert with the right error if sub-domain busy', async function () {
    const domain = 'aaa.'+parentDomain;
    await successReserveDomain({ contract, periods: 1, mainPrice, domain });
    await expect(
      contract.reserveDomain(domain, 1, {
        value: mainPrice,
      }),
    ).to.be.revertedWith('not free domain');
  });

  it('Should reserve many sub-domains', async function () {
    await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'aaa.'+parentDomain });
    await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'bbb.aaa.'+parentDomain });
    await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'ccc.bbb.aaa.'+parentDomain });
  });

  it('Should reserve sub-domain with prefix', async function () {
    await successReserveDomain({ contract, periods: 1, mainPrice, domain: 'https://aaa.'+parentDomain });
  });

  it('Should revert with the right error if parent domain is free', async function () {
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
