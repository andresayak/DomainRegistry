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

  it('Should cut correct text', async function () {
    const text = 'hello00000';
    expect(await contract.substrV1(text, 1, 3))
      .to.emit(contract, 'Test')
      .withArgs('el');
    expect(await contract.substrV2(text, 2, 5))
      .to.emit(contract, 'Test')
      .withArgs('llo');
  });

  it('Should remove domain protocol', async function () {
    expect(await contract.clearDomainV1('https://aaa.com'))
      .to.emit(contract, 'Test')
      .withArgs('aaa.com');
    expect(await contract.clearDomainV1('http://bbb.a.com'))
      .to.emit(contract, 'Test')
      .withArgs('bbb.a.com');
    expect(await contract.clearDomainV1('some_protocol://ccc.bbb.com'))
      .to.emit(contract, 'Test')
      .withArgs('ccc.bbb.com');

    expect(await contract.clearDomainV2('https://aaa.com'))
      .to.emit(contract, 'Test')
      .withArgs('aaa.com');
    expect(await contract.clearDomainV2('http://bbb.a.com'))
      .to.emit(contract, 'Test')
      .withArgs('bbb.a.com');
    expect(await contract.clearDomainV2('some_protocol://ccc.bbb.com'))
      .to.emit(contract, 'Test')
      .withArgs('ccc.bbb.com');
  });

  it('Should get right parent domain', async function () {
    expect(await contract.parentDomainV1('aaa.com'))
      .to.emit(contract, 'Test')
      .withArgs('com');
    expect(await contract.parentDomainV1('aaa'))
      .to.emit(contract, 'Test')
      .withArgs('');

    expect(await contract.parentDomainV2('aaa.com'))
      .to.emit(contract, 'Test')
      .withArgs('com');
    expect(await contract.parentDomainV2('aaa'))
      .to.emit(contract, 'Test')
      .withArgs('');
  });
});
