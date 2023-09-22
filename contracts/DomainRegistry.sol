// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

struct DomainRecord {
  address owner;
  string ipAddress;
}

contract DomainRegistry {
  uint public lockAmount;
  bool internal locked;
  mapping(string => DomainRecord) public registry;

  modifier noReentrant() {
    require(!locked, "No re-entrancy");
    locked = true;
    _;
    locked = false;
  }

  modifier notDots(bytes memory _domainBytes) {
    bytes memory _dotBytes = bytes(".");

    require(_domainBytes.length != 0, "empty domain");

    for (uint i = 0; i < _domainBytes.length; i++) {
      if (_domainBytes[i] == _dotBytes[0]) {
        require(false, "wrong domain format");
      }
    }
    _;
  }

  event DomainReserved(string domain, string ipAddress, address indexed sender);
  event DomainRemoved(string domain);

  constructor(uint _lockAmount) {
    lockAmount = _lockAmount;
  }

  function reserveDomain(string memory _domain, string memory _ipAddress) external payable {
    require(checkIsFreeDomain(_domain), "not free domain");
    require(msg.value == lockAmount, "wrong value");

    registry[_domain] = DomainRecord(msg.sender, _ipAddress);
    emit DomainReserved(_domain, _ipAddress, msg.sender);
  }

  function checkIsFreeDomain(string memory _domain) public view notDots(bytes(_domain)) returns (bool) {
    return registry[_domain].owner == address(0);
  }

  function removeReservationDomain(string memory _domain) external noReentrant {
    require(registry[_domain].owner == msg.sender, "wrong sender");

    (bool sent, ) = msg.sender.call{value: lockAmount}("");
    require(sent, "failed to send Ether");

    registry[_domain] = DomainRecord(address(0), "");

    emit DomainRemoved(_domain);
  }

  function resolveIp(string memory _domain) external view returns (string memory) {
    return registry[_domain].ipAddress;
  }
}
