const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { faker } = require('@faker-js/faker');

describe('DomainRegistry', function() {
  const deployOneYearLockFixture = async (
    lockAmount = 1_000_000_000, // 1 Gwei
  ) => {

    const [owner, otherAccount] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory('DomainRegistry');
    const contract = await Contract.deploy(lockAmount);

    return { contract, lockAmount, owner, otherAccount };
  };

  const successReserveDomain = async ({ contract, lockAmount }) => {
    const domain = faker.internet.domainSuffix();
    const ipv4 = faker.internet.ipv4();

    expect(await contract.checkIsFreeDomain(domain)).to.be.true;

    await expect(contract.reserveDomain(domain, ipv4, {
      value: lockAmount,
    })).not.to.be.reverted;
    return {
      domain, ipv4,
    };
  };

  describe('Deployment', function() {
    it('Should set the right lockAmount', async function() {
      const { contract, lockAmount } = await loadFixture(deployOneYearLockFixture);

      expect(await contract.lockAmount()).to.equal(lockAmount);
    });

    describe('Adding domain', function() {
      it('Should reserve domain and store the funds to lock', async function() {
        const { contract, lockAmount, owner } = await loadFixture(deployOneYearLockFixture);

        const domain = faker.internet.domainSuffix();
        const ipv4 = faker.internet.ipv4();

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;

        const tx = contract.reserveDomain(domain, ipv4, {
          value: lockAmount,
        });
        await expect(tx).to.emit(contract, 'DomainReserved')
          .withArgs(domain, ipv4, owner.address);

        await expect(tx)
          .to.changeEtherBalances(
            [contract, owner],
            [lockAmount, -lockAmount],
          );

        expect(await ethers.provider.getBalance(contract.target)).to.equal(
          lockAmount,
        );

        expect(await contract.checkIsFreeDomain(domain)).to.be.false;
        expect(await contract.resolveIp(domain)).to.be.equal(ipv4);
      });

      it('Should revert with the right error if domain empty', async function() {
        const { contract, lockAmount } = await loadFixture(deployOneYearLockFixture);

        const domain = '';
        const ipv4 = faker.internet.ipv4();

        await expect(contract.reserveDomain(domain, ipv4, {
          value: lockAmount,
        })).to.be.revertedWith(
          'empty domain',
        );
      });

      it('Should revert with the right error if domain format wrong', async function() {
        const { contract, lockAmount } = await loadFixture(deployOneYearLockFixture);

        const domain = faker.internet.domainName();
        const ipv4 = faker.internet.ipv4();

        await expect(contract.reserveDomain(domain, ipv4, {
          value: lockAmount,
        })).to.be.revertedWith(
          'wrong domain format',
        );
      });

      it('Should revert with the right error if wrong funds', async function() {
        const { contract } = await loadFixture(deployOneYearLockFixture);

        const domain = faker.internet.domainSuffix();
        const ipv4 = faker.internet.ipv4();

        await expect(contract.reserveDomain(domain, ipv4, {
          value: 0,
        })).to.be.revertedWith(
          'wrong value',
        );
        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
      });
    });

    describe('Removing domain', function() {
      it('Should remove domain reservation and return the funds', async function() {
        const { contract, lockAmount, owner }
          = await loadFixture(deployOneYearLockFixture);

        const { domain } = await successReserveDomain({ contract, lockAmount });

        const tx = contract.removeReservationDomain(domain);
        await expect(tx)
          .to.changeEtherBalances(
            [owner, contract],
            [lockAmount, -lockAmount],
          );
        await expect(tx).to.emit(contract, 'DomainRemoved')
          .withArgs(domain);

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
        expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
      });

      it('Should revert with the right error if domain have\'t reserved', async function() {
        const { contract, otherAccount } = await loadFixture(deployOneYearLockFixture);

        const domain = faker.internet.domainSuffix();

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.checkIsFreeDomain(domain)).to.be.true;
      });

      it('Should revert with the right error if wrong owner', async function() {
        const { contract, lockAmount, otherAccount } = await loadFixture(deployOneYearLockFixture);


        const { domain } = await successReserveDomain({ contract, lockAmount });

        await expect(contract.connect(otherAccount).removeReservationDomain(domain)).to.be.revertedWith('wrong sender');

        expect(await contract.checkIsFreeDomain(domain)).to.be.false;
      });

    });
  });
});
