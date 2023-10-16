// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
//import "hardhat/console.sol";

import './LibUtils.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

struct DomainRecord {
  address owner;
  uint createdAt;
  uint finishedAt;
}

contract DomainRegistry is Pausable, Ownable {
  address public treasure;
  uint public mainPrice;
  uint public paymentPeriod;
  bool internal locked;
  mapping(string => DomainRecord) internal registryByName;

  modifier noReentrant() {
    require(!locked, 'No re-entrancy');
    locked = true;
    _;
    locked = false;
  }

  event DomainReserved(address indexed sender, string indexed domain, uint cost, uint createdAt, uint finishedAt);
  event DomainRemoved(address indexed sender, string indexed domain);
  event DomainContinue(address indexed sender, string indexed domain, uint cost, uint finishedAt);
  event TreasureChanged(address treasure);
  event MainPriceChanged(uint mainPrice);
  event PaymentPeriodChanged(uint paymentPeriod);

  constructor(uint _mainPrice, address _treasure, uint _paymentPeriod) Ownable(_msgSender()) {
    mainPrice = _mainPrice;
    treasure = _treasure;
    paymentPeriod = _paymentPeriod;
  }

  function changeTreasure(address _treasure) external onlyOwner {
    require(_treasure != address(0), 'wrong address');
    treasure = _treasure;
    emit TreasureChanged(_treasure);
  }

  function changeMainPrice(uint _mainPrice) external onlyOwner {
    mainPrice = _mainPrice;
    emit MainPriceChanged(_mainPrice);
  }

  function changePaymentPeriod(uint _paymentPeriod) external onlyOwner {
    require(_paymentPeriod > 0, 'wrong payment period');
    paymentPeriod = _paymentPeriod;
    emit PaymentPeriodChanged(_paymentPeriod);
  }

  function reserveDomain(string memory _domain, uint8 _periods) external payable whenNotPaused noReentrant {
    _domain = Utils.clearDomain(_domain);
    require(_onlyFreeDomain(_domain), 'not free domain');
    require(_periods > 0, 'wrong periods');
    string memory _parentDomain = Utils.parentDomain(_domain);
    if (bytes(_parentDomain).length > 0) {
      require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
    }
    uint _createdAt = block.timestamp;
    (uint _finishedAt, uint _cost) = paymentProcessing(mainPrice, _periods, _createdAt);

    DomainRecord memory _record;
    _record.owner = _msgSender();
    _record.createdAt = _createdAt;
    _record.finishedAt = _finishedAt;

    registryByName[_domain] = _record;
    emit DomainReserved(_msgSender(), _domain, _cost, _createdAt, _finishedAt);
  }

  function continueDomain(string memory _domain, uint8 _periods) external payable whenNotPaused noReentrant {
    _domain = Utils.clearDomain(_domain);
    validateDomainOwner(_domain);
    require(_periods > 0, 'wrong periods');
    DomainRecord storage _record = registryByName[_domain];

    uint _createdAt = _record.finishedAt;
    (uint _finishedAt, uint _cost) = paymentProcessing(mainPrice, _periods, _createdAt);

    _record.finishedAt = _finishedAt;
    emit DomainContinue(_msgSender(), _domain, _cost, _finishedAt);
  }

  function paymentProcessing(uint _price, uint8 _periods, uint _periodStartedAt) internal returns (uint, uint) {
    uint _cost = _price * _periods;
    require(msg.value == _cost, 'wrong value');
    uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);

    (bool sent, ) = treasure.call{value: msg.value}('');
    require(sent, 'failed to send Ether');
    return (_finishedAt, _cost);
  }

  function domainInfo(string memory _domain) external view returns (DomainRecord memory) {
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

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function validateDomainOwner(string memory _domain) internal view {
    require(registryByName[_domain].owner == _msgSender(), 'wrong sender');
  }
}
