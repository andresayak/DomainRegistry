// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "hardhat/console.sol";

import './LibUtils.sol';
import './DomainRegistry.sol';

contract DomainRegistryV2 is DomainRegistry {
  uint public fee;
  mapping (address => uint) public rewards;

  event FeeChanged(uint fee);
  event WithdrawReward(address indexed sender, uint amount);

  function setFee(uint _fee) external onlyOwner {
    fee = _fee;
    emit FeeChanged(_fee);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor(){
    _disableInitializers();
  }

  function reserveDomain(string memory _domain, uint8 _periods) external payable override noReentrant {
    _domain = Utils.clearDomain(_domain);
    require(_onlyFreeDomain(_domain), 'not free domain');
    require(_periods > 0, 'wrong periods');
    string memory _parentDomain = Utils.parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
    }
    uint _createdAt = block.timestamp;
    (uint _finishedAt, uint _cost) = paymentProcessing(_parentDomain, mainPrice, _periods, _createdAt);

    DomainRecord memory _record;
    _record.owner = _msgSender();
    _record.createdAt = _createdAt;
    _record.finishedAt = _finishedAt;

    registryByName[_domain] = _record;
    emit DomainReserved(_msgSender(), _domain, _cost, _createdAt, _finishedAt);
  }

  function continueDomain(string memory _domain, uint8 _periods) external payable override noReentrant {
    _domain = Utils.clearDomain(_domain);
    validateDomainOwner(_domain);
    require(_periods > 0, 'wrong periods');
    string memory _parentDomain = Utils.parentDomain(_domain);
    DomainRecord storage _record = registryByName[_domain];

    uint _createdAt = _record.finishedAt;
    (uint _finishedAt, uint _cost) = paymentProcessing(_parentDomain, mainPrice, _periods, _createdAt);

    _record.finishedAt = _finishedAt;
    emit DomainContinue(_msgSender(), _domain, _cost, _finishedAt);
  }

  function paymentProcessing(string memory _parentDomain, uint _price, uint8 _periods, uint _periodStartedAt) internal returns (uint, uint) {
    uint _cost = _price * _periods;

    require(msg.value == _cost, 'wrong value');
    uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);
    uint _fee = fee > 0 ? (_cost * fee) / 100 : 0;
    uint _costWithoutFee = _cost;

    if (bytes(_parentDomain).length > 0 && _fee > 0 && !_onlyFreeDomain(_parentDomain)) {
      DomainRecord storage _parentRecord = registryByName[_parentDomain];
      rewards[_parentRecord.owner]+= _fee;
      _costWithoutFee = _cost - _fee;
    }
    rewards[treasure]+= _costWithoutFee;
    return (_finishedAt, _cost);
  }

  function withdrawReward() external {
    uint _reward = rewards[_msgSender()];
    require(_reward > 0, 'no reward');

    rewards[_msgSender()] = 0;

    (bool sent, ) = _msgSender().call{value: _reward}('');
    require(sent, 'failed to send Ether');
    emit WithdrawReward(_msgSender(), _reward);
  }
}
