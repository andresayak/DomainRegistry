// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import './LibUtils.sol';
import './DomainRegistry.sol';

/// @author Andrii Saiak
/// @title DomainRegistry - A smart contract for domain registration and management.
contract DomainRegistryV2 is DomainRegistry {
  uint public fee;
  mapping(address => uint) public rewards;

  event FeeChanged(uint fee);
  event WithdrawReward(address indexed sender, uint amount);
  event RewardAdded(address indexed account, uint amount);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Reserve a domain for a specified number of periods.
  /// @dev Allows users to reserve a domain by providing the domain name and the number of periods they want to reserve
  /// it for. The cost of the reservation is calculated based on the main price and the specified number of periods.
  /// @param _domain The domain name to be reserved.
  /// @param _periods The number of periods for which the domain will be reserved.
  function reserveDomain(string memory _domain, uint8 _periods) external payable override noReentrant {
    _domain = Utils.clearDomain(_domain);
    require(_onlyFreeDomain(_domain), 'not free domain');
    require(_periods > 0, 'wrong periods');
    string memory _parentDomain = Utils.parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
    }
    uint _createdAt = block.timestamp;
    (uint _finishedAt, uint _cost) = _paymentProcessing(_parentDomain, mainPrice, _periods, _createdAt);

    DomainRecord memory _record;
    _record.owner = _msgSender();
    _record.createdAt = _createdAt;
    _record.finishedAt = _finishedAt;

    registryByName[_domain] = _record;
    emit DomainReserved(_msgSender(), _domain, _cost, _createdAt, _finishedAt);
  }

  /// @notice Extend the reservation of an existing domain for additional periods.
  /// @dev Allows the owner of a previously reserved domain to extend the reservation by specifying the number of
  /// additional periods. The cost of the extension is calculated based on the main price and the specified number
  /// of periods.
  /// @param _domain The domain name for which the reservation will be extended.
  /// @param _periods The number of additional periods for which the domain will be reserved.
  function continueDomain(string memory _domain, uint8 _periods) external payable override noReentrant {
    _domain = Utils.clearDomain(_domain);
    _validateDomainOwner(_domain);
    require(_periods > 0, 'wrong periods');
    string memory _parentDomain = Utils.parentDomain(_domain);
    DomainRecord storage _record = registryByName[_domain];

    uint _createdAt = _record.finishedAt;
    (uint _finishedAt, uint _cost) = _paymentProcessing(_parentDomain, mainPrice, _periods, _createdAt);

    _record.finishedAt = _finishedAt;
    emit DomainContinue(_msgSender(), _domain, _cost, _finishedAt);
  }

  /// @notice Withdraw accrued rewards.
  /// @dev Allows users to withdraw any rewards they have earned for referring others to register domains.
  /// The rewards are accumulated in the `rewards` mapping and can be withdrawn as Ether.
  function withdrawReward() external noReentrant {
    uint _reward = rewards[_msgSender()];
    require(_reward > 0, 'no reward');

    (bool sent, ) = _msgSender().call{value: _reward}('');
    require(sent, 'failed to send Ether');

    rewards[_msgSender()] = 0;
    emit WithdrawReward(_msgSender(), _reward);
  }

  /// @notice Set the fee percentage for domain registration.
  /// @dev Allows the owner of the contract to set the fee percentage, which is deducted from the cost of domain
  /// registration. The fee is distributed to the owner of the parent domain (if applicable) and the contract's
  /// treasury address.
  /// @param _fee The new fee percentage to be set.
  function setFee(uint _fee) external onlyOwner {
    fee = _fee;
    emit FeeChanged(_fee);
  }

  /// @notice Process payments for domain reservations and extensions.
  /// @dev Internal function used to handle the payment processing for domain reservations and extensions.
  /// It calculates the cost of the reservation, verifies the provided value, and transfers funds to the contract's
  /// treasury address.
  /// @param _parentDomain The parent domain that will receive the reward
  /// @param _price The price of a single period of domain registration.
  /// @param _periods The number of periods for which the domain will be reserved or extended.
  /// @param _periodStartedAt The timestamp when the current period started.
  /// @return The timestamp when the reservation or extension period will end and the total cost of the transaction.
  function _paymentProcessing(string memory _parentDomain, uint _price, uint8 _periods, uint _periodStartedAt)
    internal
    returns (uint, uint)
  {
    uint _cost = _price * _periods;

    require(msg.value == _cost, 'wrong value');
    uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);
    uint _fee = fee > 0 ? (_cost * fee) / 100 : 0;
    uint _costWithoutFee = _cost;

    if (bytes(_parentDomain).length > 0 && _fee > 0 && !_onlyFreeDomain(_parentDomain)) {
      DomainRecord storage _parentRecord = registryByName[_parentDomain];
      rewards[_parentRecord.owner] += _fee;
      _costWithoutFee = _cost - _fee;
      emit RewardAdded(_parentRecord.owner, _fee);
    }
    if(_costWithoutFee > 0){
      rewards[treasure] += _costWithoutFee;
      emit RewardAdded(treasure, _fee);
    }
    return (_finishedAt, _cost);
  }
}
