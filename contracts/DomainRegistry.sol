// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

struct DomainRecord {
  address owner;
  uint ownerIndex;
  uint globalIndex;
  uint parentIndex;
}

contract DomainRegistry {
  uint public lockAmount;
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

  event DomainReserved(string domain, address indexed sender);
  event DomainRemoved(string domain);

  constructor(uint _lockAmount) {
    lockAmount = _lockAmount;
  }

  function clearDomain(string memory _domain) internal pure returns (string memory) {
    bytes memory _domainBytes = bytes(_domain);
    bytes memory _prefixBytes = bytes('https://');
    if (_domainBytes.length >= _prefixBytes.length) {
      bool _found = true;
      for (uint i = 0; i < _prefixBytes.length; i++) {
        if (_domainBytes[i] != _prefixBytes[i]) {
          _found = false;
          break;
        }
      }
      if (_found) {
        uint _startIndex = _prefixBytes.length;
        _domain = string(substr(_domainBytes, _startIndex, _domainBytes.length));
      }
    }
    return _domain;
  }

  function parentDomain(string memory _domain) public pure returns (string memory _parentDomain) {
    bytes memory _domainBytes = bytes(_domain);
    bytes memory _dotBytes = bytes('.');

    require(_domainBytes.length != 0, 'empty domain');

    _parentDomain = '';
    for (uint i = 0; i < _domainBytes.length; i++) {
      if (_domainBytes[i] == _dotBytes[0]) {
        uint _startIndex = i + 1;
        _parentDomain = string(substr(_domainBytes, _startIndex, _domainBytes.length));
        break;
      }
    }
  }

  function substr(bytes memory _strBytes, uint _startIndex, uint _endIndex) internal pure returns (bytes memory _result) {
    _result = new bytes(_endIndex - _startIndex);
    for (uint _i = _startIndex; _i < _endIndex; _i++) {
      _result[_i - _startIndex] = _strBytes[_i];
    }
  }

  function reserveDomain(string memory _domain) external payable {
    _domain = clearDomain(_domain);
    string memory _parentDomain = parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!checkIsFreeDomain(_parentDomain), 'parent domain is free');
    }

    require(checkIsFreeDomain(_domain), 'not free domain');
    require(msg.value == lockAmount, 'wrong value');

    registryByName[_domain] = DomainRecord(msg.sender, registryByOwner[msg.sender].length, domains.length, registryByParent[_parentDomain].length);
    registryByOwner[msg.sender].push(_domain);
    registryByParent[_parentDomain].push(_domain);
    domains.push(_domain);

    emit DomainReserved(_domain, msg.sender);
  }

  function checkIsFreeDomain(string memory _domain) public view returns (bool) {
    return registryByName[_domain].owner == address(0);
  }

  function removeReservationDomain(string memory _domain) external noReentrant onlyOwner(_domain) {
    _domain = clearDomain(_domain);
    string memory _parentDomain = parentDomain(_domain);

    (bool sent, ) = msg.sender.call{value: lockAmount}('');
    require(sent, 'failed to send Ether');

    DomainRecord storage _record = registryByName[_domain];
    _clearIndexes(msg.sender, _parentDomain, _record.ownerIndex, _record.globalIndex, _record.parentIndex);
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

  function _clearIndexes(address _owner, string memory _parent, uint _indexOwner, uint _indexGlobal, uint _indexParent) internal {
    if (_indexOwner >= registryByOwner[_owner].length) return;
    if (_indexParent >= registryByParent[_parent].length) return;
    if (_indexGlobal >= domains.length) return;

    if (registryByOwner[_owner].length > _indexOwner + 1) {
      string memory updateDomain = registryByOwner[_owner][registryByOwner[_owner].length - 1];
      registryByOwner[_owner][_indexOwner] = updateDomain;
      registryByName[updateDomain].ownerIndex = _indexOwner;
    }
    if (registryByParent[_parent].length > _indexParent + 1) {
      string memory updateDomain = registryByParent[_parent][registryByParent[_parent].length - 1];
      registryByParent[_parent][_indexParent] = updateDomain;
      registryByName[updateDomain].parentIndex = _indexParent;
    }
    if (domains.length > _indexGlobal + 1) {
      string memory updateDomain = domains[domains.length - 1];
      domains[_indexGlobal] = updateDomain;
      registryByName[updateDomain].globalIndex = _indexGlobal;
    }
    registryByOwner[_owner].pop();
    registryByParent[_parent].pop();
    domains.pop();
  }
}
