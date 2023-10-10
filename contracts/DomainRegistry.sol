// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
//import "hardhat/console.sol";

import './LibUtilsV2.sol';

    struct DomainRecord {
        address owner;
        uint createdAt;
        uint finishedAt;
    }

contract DomainRegistry {
    address public owner;
    address public treasure;
    uint public mainPrice;
    bool internal locked;
    mapping(string => DomainRecord) internal registryByName;

    modifier noReentrant() {
        require(!locked, 'No re-entrancy');
        locked = true;
        _;
        locked = false;
    }

    function validateDomainOwner(string memory _domain) view internal {
        require(registryByName[_domain].owner == msg.sender, 'wrong sender');
    }

    modifier onlyContractOwner() {
        require(owner == msg.sender, 'only owner');
        _;
    }

    event DomainReserved(address indexed sender, string indexed domain, uint cost, uint createdAt, uint finishedAt);
    event DomainRemoved(address indexed sender, string indexed domain);
    event DomainContinue(address indexed sender, string indexed domain, uint cost, uint finishedAt);
    event TreasureChanged(address treasure);
    event MainPriceChanged(uint mainPrice);

    constructor(uint _mainPrice, address _treasure) {
        mainPrice = _mainPrice;
        treasure = _treasure;
        owner = msg.sender;
    }

    function changeTreasure(address _treasure) external onlyContractOwner {
        treasure = _treasure;
        emit TreasureChanged(_treasure);
    }

    function changeMainPrice(uint _mainPrice) external onlyContractOwner {
        mainPrice = _mainPrice;
        emit MainPriceChanged(_mainPrice);
    }

    function reserveDomain(string memory _domain, uint8 _periods) external payable noReentrant {
        _domain = Utils.clearDomain(_domain);
        require(_onlyFreeDomain(_domain), 'not free domain');
        require(_periods > 0, 'wrong periods');
        string memory _parentDomain = Utils.parentDomain(_domain);
        if (bytes(_parentDomain).length > 0) {
            require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
        }
        uint _createdAt = block.timestamp;
        (uint _finishedAt, uint _cost)  = paymentProcessing(mainPrice, _periods, _createdAt);

        registryByName[_domain] = DomainRecord(msg.sender, _createdAt, _finishedAt);
        emit DomainReserved(msg.sender, _domain, _cost, _createdAt, _finishedAt);
    }

    function continueDomain(string memory _domain, uint8 _periods) external payable noReentrant {
        _domain = Utils.clearDomain(_domain);
        validateDomainOwner(_domain);
        require(_periods > 0, 'wrong periods');
        DomainRecord storage _record = registryByName[_domain];

        uint _createdAt = _record.finishedAt;
        (uint _finishedAt, uint _cost) = paymentProcessing(mainPrice, _periods, _createdAt);

        _record.finishedAt = _finishedAt;
        emit DomainContinue(msg.sender, _domain, _cost, _finishedAt);
    }

    function paymentProcessing(uint _price, uint8 _periods, uint _createdAt) internal returns (uint, uint){
        uint _cost = _price * _periods;
        require(msg.value == _cost, 'wrong value');
        uint _finishedAt = _createdAt + (365 days * _periods);

        (bool sent,) = treasure.call{value: _cost}('');
        require(sent, 'failed to send Ether');
        return (_finishedAt, _cost);
    }

    function domainInfo(string memory _domain) view external returns (DomainRecord memory){
        require(!_onlyFreeDomain(_domain), 'free domain');
        return registryByName[_domain];
    }

    function isFreeDomain(string memory _domain) external view returns (bool) {
        return _onlyFreeDomain(Utils.clearDomain(_domain));
    }

    function _onlyFreeDomain(string memory _domain) public view returns (bool) {
        return registryByName[_domain].owner == address(0) || block.timestamp > registryByName[_domain].finishedAt;
    }

    function domainOwner(string memory _domain) external view returns (address) {
        return registryByName[_domain].owner;
    }
}
