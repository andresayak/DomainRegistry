// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

struct DomainRecord {
  address owner;
  uint ownerIndex;
  uint globalIndex;
}

contract DomainRegistry {
  uint public lockAmount;
  bool internal locked;
  string[] domains;
  mapping(string => DomainRecord) public registryByName;
  mapping(address => string[]) public registryByOwner;

  modifier noReentrant() {
    require(!locked, 'No re-entrancy');
    locked = true;
    _;
    locked = false;
  }

  modifier notDots(bytes memory _domainBytes) {
    bytes memory _dotBytes = bytes('.');

    require(_domainBytes.length != 0, 'empty domain');

    for (uint i = 0; i < _domainBytes.length; i++) {
      if (_domainBytes[i] == _dotBytes[0]) {
        require(false, 'wrong domain format');
      }
    }
    _;
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

  function reserveDomain(string memory _domain) external payable {
    require(checkIsFreeDomain(_domain), 'not free domain');
    require(msg.value == lockAmount, 'wrong value');

    registryByName[_domain] = DomainRecord(msg.sender, registryByOwner[msg.sender].length, domains.length);
    registryByOwner[msg.sender].push(_domain);
    domains.push(_domain);

    emit DomainReserved(_domain, msg.sender);
  }

  function checkIsFreeDomain(string memory _domain) public view notDots(bytes(_domain)) returns (bool) {
    return registryByName[_domain].owner == address(0);
  }

  function removeReservationDomain(string memory _domain) external noReentrant onlyOwner(_domain) {
    (bool sent, ) = msg.sender.call{value: lockAmount}('');
    require(sent, 'failed to send Ether');

    DomainRecord storage _record = registryByName[_domain];
    _clearIndexes(msg.sender, _record.ownerIndex, _record.globalIndex);
    registryByName[_domain] = DomainRecord(address(0), 0, 0);

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

  function _clearIndexes(address _owner, uint _indexOwner, uint _indexGlobal) internal {
    if (_indexOwner >= registryByOwner[_owner].length) return;
    if (_indexGlobal >= domains.length) return;

    if (registryByOwner[_owner].length > _indexOwner + 1) {
      string memory updateDomain = registryByOwner[_owner][registryByOwner[_owner].length - 1];
      registryByOwner[_owner][_indexOwner] = updateDomain;
      registryByName[updateDomain].ownerIndex = _indexOwner;
    }
    if (domains.length > _indexGlobal + 1) {
      string memory updateDomain = domains[domains.length - 1];
      domains[_indexGlobal] = updateDomain;
      registryByName[updateDomain].globalIndex = _indexGlobal;
    }
    domains.pop();
    registryByOwner[_owner].pop();
  }

}
