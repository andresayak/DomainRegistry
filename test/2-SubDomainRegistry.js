const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { successReserveDomain } = require('./utils');

describe('SubDomainRegistry', function () {
  let contract, owner, otherAccount;
  const lockAmount = 1_000_000_000;

  const deployContract = async () => {
    [owner, otherAccount] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('DomainRegistry')).deploy(lockAmount);

    return { contract, lockAmount, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Deployment', function () {
    const parentDomain = 'com';
    beforeEach(async ()=>{
      await successReserveDomain({contract, lockAmount, domain: parentDomain});
    });
    describe('Adding sub domain', function () {
      it('Should reserve sub-domain and store the funds to lock', async function () {

        const domain = 'aaa.'+parentDomain;
        expect(await contract.isFreeDomain(domain)).to.be.true;

        const tx = contract.reserveDomain(domain, {
          value: lockAmount,
        });
        await expect(tx).to.emit(contract, 'DomainReserved').withArgs(owner.address, domain, lockAmount);

        await expect(tx).to.changeEtherBalances([contract, owner], [lockAmount, -lockAmount]);

        expect(await contract.isFreeDomain(domain)).to.be.false;
        expect(await contract.domainOwner(domain)).to.equal(owner.address);
      });

      it('Should reserve many sub-domains', async function () {
        await successReserveDomain({ contract, lockAmount, domain: 'aaa.'+parentDomain });
        await successReserveDomain({ contract, lockAmount, domain: 'bbb.aaa.'+parentDomain });
        await successReserveDomain({ contract, lockAmount, domain: 'ccc.bbb.aaa.'+parentDomain });
      });

      it('Should reserve sub-domain with prefix', async function () {
        await successReserveDomain({ contract, lockAmount, domain: 'https://aaa.'+parentDomain });
      });

      it('Should revert with the right error if parent domain is free', async function () {
        const domain = 'aaa.xxx';

        await expect(
          contract.reserveDomain(domain, {
            value: lockAmount,
          }),
        ).to.be.revertedWith('parent domain is free');
      });
    });

    describe('Sub domains pagination by parent domain', function () {
      const [domain1, domain2, domain3] = ['aaa.'+parentDomain, 'bbb.'+parentDomain, 'ccc.'+parentDomain];

      beforeEach(async () => {
        await successReserveDomain({ contract, lockAmount, domain: domain1 });
        await successReserveDomain({ contract, lockAmount, domain: domain2 });
        await successReserveDomain({ contract, lockAmount, domain: domain3 });
      });
    });
  });
});
