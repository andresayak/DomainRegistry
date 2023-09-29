const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('DomainRegistry', function () {
  let contract, owner, otherAccount;
  const lockAmount = 1_000_000_000;

  const deployContract = async () => {
    [owner, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory('DomainRegistry');
    contract = await Contract.deploy(lockAmount);

    return { contract, lockAmount, owner, otherAccount };
  };

  const successReserveDomain = async ({ contract, lockAmount, domain }) => {
    expect(await contract.checkIsFreeDomain(domain)).to.be.true;

    await expect(
      contract.reserveDomain(domain, {
        value: lockAmount,
      }),
    ).not.to.be.reverted;
    return {
      domain,
    };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Deployment', function () {
    it('Should set the right lockAmount', async function () {
      expect(await contract.lockAmount()).to.equal(lockAmount);
    });

    describe('Adding domain', function () {
      it('Should reserve domain and store the funds to lock', async function () {
        const domain = 'com';

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;

        const tx = contract.reserveDomain(domain, {
          value: lockAmount,
        });
        await expect(tx).to.emit(contract, 'DomainReserved').withArgs(domain, owner.address);

        await expect(tx).to.changeEtherBalances([contract, owner], [lockAmount, -lockAmount]);

        expect(await ethers.provider.getBalance(contract.target)).to.equal(lockAmount);

        expect(await contract.checkIsFreeDomain(domain)).to.be.false;
        expect(await contract.domainOwner(domain)).to.equal(owner.address);
      });

      it('Should reserve many domains', async function () {
        await successReserveDomain({ contract, lockAmount, domain: 'aaa' });
        await successReserveDomain({ contract, lockAmount, domain: 'bbb' });
      });

      it('Should revert with the right error if domain empty', async function () {
        const domain = '';

        await expect(
          contract.reserveDomain(domain, {
            value: lockAmount,
          }),
        ).to.be.revertedWith('empty domain');
      });

      it('Should revert with the right error if domain format wrong', async function () {
        const domain = 'bbb.aaa';

        await expect(
          contract.reserveDomain(domain, {
            value: lockAmount,
          }),
        ).to.be.revertedWith('wrong domain format');
      });

      it('Should revert with the right error if wrong funds', async function () {
        const domain = 'aaa';

        await expect(
          contract.reserveDomain(domain, {
            value: 0,
          }),
        ).to.be.revertedWith('wrong value');
        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
      });
    });

    describe('Removing domain', function () {
      it('Should remove domain reservation and return the funds', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        const tx = contract.removeReservationDomain(domain);
        await expect(tx).to.changeEtherBalances([owner, contract], [lockAmount, -lockAmount]);
        await expect(tx).to.emit(contract, 'DomainRemoved').withArgs(domain);

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
        expect(await contract.domainOwner(domain)).to.equal(ZERO_ADDRESS);
        expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
      });

      it('Should revert with the right error if domain have\'t reserved', async function () {
        const domain = 'aaa';

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
      });

      it('Should revert with the right error if wrong owner', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.checkIsFreeDomain(domain)).to.be.false;
      });

      it('Should fail second try remove request', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        await expect(contract.removeReservationDomain(domain)).not.to.be.reverted;
        await expect(contract.removeReservationDomain(domain)).to.be.reverted;
      });
    });

    describe('Domains pagination', function () {
      const [domain1, domain2, domain3] = ['aaa', 'bbb', 'ccc'];

      beforeEach(async () => {
        await successReserveDomain({ contract, lockAmount, domain: domain1 });
        await successReserveDomain({ contract, lockAmount, domain: domain2 });
        await successReserveDomain({ contract, lockAmount, domain: domain3 });
      });

      it('Should fetch right ordered list', async function () {
        expect(await contract.getDomainsCountByOwner(owner)).to.be.equal(3);
        expect(await contract.getDomainsByOwnerWithPagination(owner, 1, 2)).to.have.ordered.members([domain1, domain2]);
        expect(await contract.getDomainsByOwnerWithPagination(owner, 2, 2)).to.have.ordered.members([domain3]);
      });

      it('Should fetch true list after remove last in list domain', async function () {
        await expect(contract.removeReservationDomain(domain3)).not.to.be.reverted;
        expect(await contract.getDomainsCountByOwner(owner)).to.be.equal(2);
        expect(await contract.getDomainsByOwnerWithPagination(owner, 1, 2)).to.have.ordered.members([domain1, domain2]);
      });

      it('Should fetch true list after remove first in list domain', async function () {
        await expect(contract.removeReservationDomain(domain1)).not.to.be.reverted;
        expect(await contract.getDomainsCountByOwner(owner)).to.be.equal(2);
        expect(await contract.getDomainsByOwnerWithPagination(owner, 1, 2)).to.have.ordered.members([domain3, domain2]);
      });
    });
  });
});
