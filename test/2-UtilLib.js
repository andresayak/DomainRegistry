const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe.only('UtilLib', function () {
  let contract, owner, otherAccount;

  const deployContract = async () => {
    [owner, otherAccount] = await ethers.getSigners();

    contract = await (await ethers.getContractFactory('ContractForTest')).deploy();

    return { contract, owner, otherAccount };
  };

  beforeEach(async () => loadFixture(deployContract));

  describe('Deployment', function () {
    it('Should cut correct text', async function () {

      const text = 'hello';
      expect(await contract.substrV1(text, 1, 4)).to.emit(contract, 'Test').withArgs('ell');
      expect(await contract.substrV2(text, 1, 4)).to.emit(contract, 'Test').withArgs('ell');
    });
  });
});
