// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './LibUtils.sol';

struct DomainRecord {
  address owner;
  uint ownerIndex;
  uint globalIndex;
  uint parentIndex;
}

contract DomainRegistry {
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

  modifier onlyOwner(string memory _domain) {
    require(registryByName[_domain].owner == msg.sender, 'wrong sender');
    _;
  }

  event DomainReserved(address indexed sender, string domain);
  event DomainRemoved(string domain);

  constructor(uint _reservationDeposit) {
    reservationDeposit = _reservationDeposit;
  }

  function reserveDomain(string memory _domain) external payable {
    _domain = Utils.clearDomain(_domain);
    string memory _parentDomain = Utils.parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!_checkIsFreeDomain(_parentDomain), 'parent domain is free');
    }
    require(_checkIsFreeDomain(_domain), 'not free domain');
    require(msg.value == reservationDeposit, 'wrong value');

    registryByName[_domain] = DomainRecord(msg.sender, registryByOwner[msg.sender].length, domains.length, registryByParent[_parentDomain].length);
    registryByOwner[msg.sender].push(_domain);
    registryByParent[_parentDomain].push(_domain);
    domains.push(_domain);
    emit DomainReserved(msg.sender, _domain);
  }

  function checkIsFreeDomain(string memory _domain) external view returns (bool) {
    _domain = Utils.clearDomain(_domain);
    return _checkIsFreeDomain(_domain);
  }

  function _checkIsFreeDomain(string memory _domain) public view returns (bool) {
    return registryByName[_domain].owner == address(0);
  }

  function removeReservationDomain(string memory _domain) external noReentrant onlyOwner(_domain) {
    _domain = Utils.clearDomain(_domain);
    string memory _parentDomain = Utils.parentDomain(_domain);

    (bool sent, ) = msg.sender.call{value: reservationDeposit}('');
    require(sent, 'failed to send Ether');

    DomainRecord storage _record = registryByName[_domain];
    _clearIndexes(msg.sender, _parentDomain, _record);
    registryByName[_domain] = DomainRecord(address(0), 0, 0, 0);

    emit DomainRemoved(_domain);
  }

  function domainOwner(string memory _domain) external view returns (address) {
    return registryByName[_domain].owner;
  }

  function getDomainsCount() external view returns (uint) {
    return domains.length;
  }

  function getDomainsCountByOwner(address owner) external view returns (uint) {
    return registryByOwner[owner].length;
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
