const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { successReserveDomain, ZERO_ADDRESS } = require('./utils');

describe('DomainRegistry', function () {
  let contract, owner, otherAccount;
  const lockAmount = 1_000_000_000;

  const deployContract = async () => {
    [owner, otherAccount] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('DomainRegistry')).deploy(lockAmount);

    return { contract, lockAmount, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Deployment', function () {
    it('Should set the right deposit amount', async function () {
      expect(await contract.reservationDeposit()).to.equal(lockAmount);
    });

    it('Should set the new right deposit amount', async function () {
      const newLockAmount = lockAmount + 1;
      await expect(contract.changeReservationDeposit(newLockAmount)).to.emit(contract, 'ReservationDepositChanged').withArgs(newLockAmount);
      expect(await contract.reservationDeposit()).to.equal(newLockAmount);
    });

    describe('Adding domain', function () {
      it('Should reserve domain and store the funds to lock', async function () {
        const domain = 'com';

        expect(await contract.isFreeDomain(domain)).to.be.true;

        const tx = contract.reserveDomain(domain, {
          value: lockAmount,
        });
        await expect(tx).to.emit(contract, 'DomainReserved').withArgs(owner.address, domain, lockAmount);

        await expect(tx).to.changeEtherBalances([contract, owner], [lockAmount, -lockAmount]);

        expect(await ethers.provider.getBalance(contract.target)).to.equal(lockAmount);

        expect(await contract.isFreeDomain(domain)).to.be.false;
        expect(await contract.domainOwner(domain)).to.equal(owner.address);
      });

      it('Should reserve many domains', async function () {
        await successReserveDomain({ contract, lockAmount, domain: 'aaa' });
        await successReserveDomain({ contract, lockAmount, domain: 'bbb' });
      });

      it('Should reserve domain with prefix', async function () {
        await successReserveDomain({ contract, lockAmount, domain: 'https://aaa' });
        expect(await contract.domainOwner('https://aaa')).to.equal(ZERO_ADDRESS);
        expect(await contract.domainOwner('aaa')).to.equal(owner.address);
      });

      it('Should reserve domain length more prefix', async function () {
        const domain = 'aaaaaaaaaaaaaaaaaaaa';
        await successReserveDomain({ contract, lockAmount, domain });
        expect(await contract.domainOwner(domain)).to.equal(owner.address);
      });

      it('Should revert with the right error if domain empty', async function () {
        const domain = '';

        await expect(
          contract.reserveDomain(domain, {
            value: lockAmount,
          }),
        ).to.be.revertedWith('empty domain');
      });

      it('Should revert with the right error if wrong funds', async function () {
        const domain = 'aaa';

        await expect(
          contract.reserveDomain(domain, {
            value: 0,
          }),
        ).to.be.revertedWith('wrong value');
        expect(await contract.isFreeDomain(domain)).to.be.true;
      });
    });

    describe('Removing domain', function () {
      it('Should remove domain reservation and return the funds', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        const tx = contract.removeReservationDomain(domain);
        await expect(tx).to.changeEtherBalances([owner, contract], [lockAmount, -lockAmount]);
        await expect(tx).to.emit(contract, 'DomainRemoved').withArgs(owner.address, domain, lockAmount);

        expect(await contract.isFreeDomain(domain)).to.be.true;
        expect(await contract.domainOwner(domain)).to.equal(ZERO_ADDRESS);
        expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
      });

      it('Should revert with the right error if domain have\'t reserved', async function () {
        const domain = 'aaa';

        expect(await contract.isFreeDomain(domain)).to.be.true;

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.isFreeDomain(domain)).to.be.true;
      });

      it('Should revert with the right error if wrong owner', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.isFreeDomain(domain)).to.be.false;
      });

      it('Should fail second try remove request', async function () {
        const domain = 'aaa';
        await successReserveDomain({ contract, lockAmount, domain });

        await expect(contract.removeReservationDomain(domain)).not.to.be.reverted;
        await expect(contract.removeReservationDomain(domain)).to.be.reverted;
      });
    });
  });
});
