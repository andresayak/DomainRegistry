const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('UtilLib', function () {
  let contract, owner, otherAccount;

  const deployContract = async () => {
    [owner, otherAccount] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('ContractForTest')).deploy();

    return { contract, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Deployment', function () {
    it('Should cut correct text', async function () {

      const text = 'hello00000';
      expect(await contract.substrV1(text, 1, 3)).to.equal('el');
      expect(await contract.substrV2(text, 2, 5)).to.equal('llo');
    });

    it('Should remove domain protocol V1', async function () {
      expect(await contract.clearDomainV1('https://aaa.com')).to.equal('aaa.com');
      expect(await contract.clearDomainV1('http://bbb.a.com')).to.equal('bbb.a.com');
      expect(await contract.clearDomainV1('some_protocol://ccc.bbb.com')).to.equal('ccc.bbb.com');
    });

    it('Should remove domain protocol V2', async function () {
      expect(await contract.clearDomainV2('https://aaa.com')).to.equal('aaa.com');
      expect(await contract.clearDomainV2('http://bbb.a.com')).to.equal('bbb.a.com');
      expect(await contract.clearDomainV2('some_protocol://ccc.bbb.com')).to.equal('ccc.bbb.com');
    });
  });
});
