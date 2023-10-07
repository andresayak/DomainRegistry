// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './LibUtilsV2.sol';

struct DomainRecord {
  address owner;
  uint deposit;
}

contract DomainRegistry {
  address public owner;
  uint public reservationDeposit;
  bool internal locked;
  uint public countDomains;
  mapping(string => DomainRecord) internal registryByName;

  modifier noReentrant() {
    require(!locked, 'No re-entrancy');
    locked = true;
    _;
    locked = false;
  }

  modifier onlyDomainOwner(string memory _domain) {
    require(registryByName[_domain].owner == msg.sender, 'wrong sender');
    _;
  }

  modifier onlyContractOwner() {
    require(owner == msg.sender, 'only owner');
    _;
  }

  modifier onlyRightDepositValue() {
    require(msg.value == reservationDeposit, 'wrong value');
    _;
  }

  event DomainReserved(address indexed sender, string domain, uint deposit);
  event DomainRemoved(address indexed sender, string domain, uint deposit);
  event ReservationDepositChanged(uint amount);

  constructor(uint _reservationDeposit) {
    reservationDeposit = _reservationDeposit;
    owner = msg.sender;
  }

  function changeReservationDeposit(uint _reservationDeposit) external onlyContractOwner{
    reservationDeposit = _reservationDeposit;
    emit ReservationDepositChanged(_reservationDeposit);
  }

  function reserveDomain(string memory _domain) external payable onlyRightDepositValue {
    _domain = Utils.clearDomain(_domain);
    string memory _parentDomain = Utils.parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
    }
    require(_onlyFreeDomain(_domain), 'not free domain');

    registryByName[_domain] = DomainRecord(msg.sender, msg.value);
    countDomains+=1;
    emit DomainReserved(msg.sender, _domain, reservationDeposit);
  }

  function isFreeDomain(string memory _domain) external view returns (bool) {
    return _onlyFreeDomain(Utils.clearDomain(_domain));
  }

  function _onlyFreeDomain(string memory _domain) public view returns (bool) {
    return registryByName[_domain].owner == address(0);
  }

  function removeReservationDomain(string memory _domain) external noReentrant onlyDomainOwner(_domain) {
    _domain = Utils.clearDomain(_domain);

    DomainRecord storage _record = registryByName[_domain];

    uint _deposit = _record.deposit;
    (bool sent, ) = msg.sender.call{value: _deposit}('');
    require(sent, 'failed to send Ether');

    registryByName[_domain] = DomainRecord(address(0), 0);

    countDomains-=1;
    emit DomainRemoved(msg.sender, _domain, _deposit);
  }

  function domainOwner(string memory _domain) external view returns (address) {
    return registryByName[_domain].owner;
  }
}
