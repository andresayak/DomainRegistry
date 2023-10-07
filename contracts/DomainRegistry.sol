// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './LibUtilsV2.sol';

struct DomainRecord {
  address owner;
  uint deposit;
  uint ownerIndex;
  uint globalIndex;
  uint parentIndex;
}

contract DomainRegistry {
  address public owner;
  uint public reservationDeposit;
  bool internal locked;
  string[] internal domains;
  mapping(string => DomainRecord) internal registryByName;
  mapping(address => string[]) internal registryByOwner;
  mapping(string => string[]) internal registryByParent;

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

  modifier onlyOwner() {
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

  function changeReservationDeposit(uint _reservationDeposit) external onlyOwner{
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

    registryByName[_domain] = DomainRecord(msg.sender, msg.value, registryByOwner[msg.sender].length, domains.length, registryByParent[_parentDomain].length);
    registryByOwner[msg.sender].push(_domain);
    registryByParent[_parentDomain].push(_domain);
    domains.push(_domain);
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

    string memory _parentDomain = Utils.parentDomain(_domain);
    _clearIndexes(msg.sender, _parentDomain, _record);

    registryByName[_domain] = DomainRecord(address(0), 0, 0, 0, 0);

    emit DomainRemoved(msg.sender, _domain, _deposit);
  }

  function domainOwner(string memory _domain) external view returns (address) {
    return registryByName[_domain].owner;
  }

  function getDomainsCount() external view returns (uint) {
    return domains.length;
  }

  function getDomainsCountByOwner(address _owner) external view returns (uint) {
    return registryByOwner[_owner].length;
  }

  function getDomainsCountByParent(string memory domain) external view returns (uint) {
    return registryByParent[domain].length;
  }

  function _pagination(string[] storage _items, uint _page, uint _limit) internal view returns (string[] memory) {
    uint _startIndex = (_page - 1) * _limit;
    uint _endIndex = _startIndex + _limit;
    if (_endIndex > _items.length) {
      _endIndex = _items.length;
    }
    require(_startIndex >= 0 && _startIndex < _endIndex, 'invalid indices');

    string[] memory result = new string[](_endIndex - _startIndex);
    for (uint i = _startIndex; i < _endIndex; i++) {
      result[i - _startIndex] = _items[i];
    }
    return result;
  }

  function getDomainsWithPagination(uint _page, uint _limit) external view returns (string[] memory) {
    return _pagination(domains, _page, _limit);
  }

  function getDomainsByOwnerWithPagination(address _owner, uint _page, uint _limit) external view returns (string[] memory) {
    return _pagination(registryByOwner[_owner], _page, _limit);
  }

  function getDomainsByParentWithPagination(string memory _parent, uint _page, uint _limit) external view returns (string[] memory) {
    return _pagination(registryByParent[_parent], _page, _limit);
  }

  function _clearIndexes(address _owner, string memory _parent, DomainRecord storage _record) internal {
    if (registryByOwner[_owner].length > _record.ownerIndex + 1) {
      string memory updateDomain = registryByOwner[_owner][registryByOwner[_owner].length - 1];
      registryByOwner[_owner][_record.ownerIndex] = updateDomain;
      registryByName[updateDomain].ownerIndex = _record.ownerIndex;
    }
    if (registryByParent[_parent].length > _record.parentIndex + 1) {
      string memory updateDomain = registryByParent[_parent][registryByParent[_parent].length - 1];
      registryByParent[_parent][_record.parentIndex] = updateDomain;
      registryByName[updateDomain].parentIndex = _record.parentIndex;
    }
    if (domains.length > _record.globalIndex + 1) {
      string memory updateDomain = domains[domains.length - 1];
      domains[_record.globalIndex] = updateDomain;
      registryByName[updateDomain].globalIndex = _record.globalIndex;
    }
    registryByOwner[_owner].pop();
    registryByParent[_parent].pop();
    domains.pop();
  }
}
