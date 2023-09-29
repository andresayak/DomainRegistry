// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

    struct DomainRecord {
        address owner;
        uint index;
    }

contract DomainRegistry {
    uint public lockAmount;
    bool internal locked;
    mapping(string => DomainRecord) public registry;
    mapping(address => string[]) public registryByOwner;

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

    modifier onlyOwner(string memory _domain) {
        require(registry[_domain].owner == msg.sender, "wrong sender");
        _;
    }

    event DomainReserved(string domain, address indexed sender);
    event DomainRemoved(string domain);

    constructor(uint _lockAmount) {
        lockAmount = _lockAmount;
    }

    function reserveDomain(string memory _domain) external payable {
        require(checkIsFreeDomain(_domain), "not free domain");
        require(msg.value == lockAmount, "wrong value");

        registry[_domain] = DomainRecord(msg.sender, registryByOwner[msg.sender].length);
        registryByOwner[msg.sender].push(_domain);
        emit DomainReserved(_domain, msg.sender);
    }

    function checkIsFreeDomain(string memory _domain) public view notDots(bytes(_domain)) returns (bool) {
        return registry[_domain].owner == address(0);
    }

    function removeReservationDomain(string memory _domain) external noReentrant onlyOwner(_domain) {
        (bool sent,) = msg.sender.call{value: lockAmount}("");
        require(sent, "failed to send Ether");

        removeDomainOwnerByIndex(msg.sender, registry[_domain].index);
        registry[_domain] = DomainRecord(address(0), 0);

        emit DomainRemoved(_domain);
    }

    function getDomainsCountByOwner(address owner) external view returns (uint) {
        return registryByOwner[owner].length;
    }

    function getDomainsByOwnerWithPagination(address _owner, uint _page, uint _limit) external view returns (string[] memory) {
        uint _startIndex = (_page - 1) * _limit;
        uint _endIndex = _startIndex + _limit;
        if (_endIndex > registryByOwner[_owner].length) {
            _endIndex = registryByOwner[_owner].length;
        }
        require(_startIndex >= 0 && _startIndex < _endIndex, "invalid indices");

        string[] memory result = new string[](_endIndex - _startIndex);
        for (uint i = _startIndex; i < _endIndex; i++) {
            result[i - _startIndex] = registryByOwner[_owner][i];
        }
        return result;
    }

    function removeDomainOwnerByIndex(address _owner, uint _index) internal {
        if (_index >= registryByOwner[_owner].length) return;

        if (registryByOwner[_owner].length > _index + 1) {
            string memory updateDomain = registryByOwner[_owner][registryByOwner[_owner].length - 1];
            registryByOwner[_owner][_index] = updateDomain;
            registry[updateDomain].index = _index;
        }

        registryByOwner[_owner].pop();
    }
}
