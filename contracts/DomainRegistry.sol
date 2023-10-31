// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "hardhat/console.sol";

import './LibUtils.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

/// @author Andrii Saiak
/// @title DomainRegistry - A smart contract for domain registration and management.
contract DomainRegistry is OwnableUpgradeable {
    uint256[500] private __gap;

    struct DomainRecord {
        address owner;
        uint createdAt;
        uint finishedAt;
        uint additionalPrice;
        uint256[46] __gap;
    }

    address public treasure;
    uint public mainPrice;
    uint public paymentPeriod;
    bool internal locked;
    mapping(string => DomainRecord) internal registryByName;
    uint public fee;
    mapping(address => uint) public rewards;

    event DomainReserved(address indexed sender, string indexed domain, uint cost, uint createdAt, uint finishedAt);
    event DomainRemoved(address indexed sender, string indexed domain);
    event DomainContinue(address indexed sender, string indexed domain, uint cost, uint finishedAt);
    event TreasureChanged(address treasure);
    event MainPriceChanged(uint mainPrice);
    event PaymentPeriodChanged(uint paymentPeriod);
    event FeeChanged(uint fee);
    event WithdrawReward(address indexed sender, uint amount);
    event AdditionalPriceChanged(address indexed sender, string indexed domain, uint amount);

    modifier noReentrant() {
        require(!locked, 'No re-entrancy');
        locked = true;
        _;
        locked = false;
    }

    /// @dev Initializes the DomainRegistry contract.
    /// @param _mainPrice The main price for domain registration.
    /// @param _treasure The address where funds are collected.
    /// @param _paymentPeriod The payment period for the domain
    function initialize(uint _mainPrice, address _treasure, uint _paymentPeriod) public initializer {
        mainPrice = _mainPrice;
        treasure = _treasure;
        paymentPeriod = _paymentPeriod;
        __Ownable_init(_msgSender());
    }

    /// @notice Change the fee
    /// @dev Only the owner of the contract can change the fee
    /// @param _fee The new fee
    function setFee(uint _fee) external onlyOwner {
        fee = _fee;
        emit FeeChanged(_fee);
    }

    /// @notice Change the address where funds are collected (treasure).
    /// @dev Only the owner of the contract can change the treasure address.
    /// @param _treasure The new address to receive funds.
    function changeTreasure(address _treasure) external onlyOwner {
        require(_treasure != address(0), 'wrong address');
        treasure = _treasure;
        emit TreasureChanged(_treasure);
    }

    /// @notice Change the main price for domain registration.
    /// @dev Only the owner of the contract can change the main price.
    /// @param _mainPrice The new price for domain registration.
    function changeMainPrice(uint _mainPrice) external onlyOwner {
        mainPrice = _mainPrice;
        emit MainPriceChanged(_mainPrice);
    }

    /// @notice Change the payment period for domain registration.
    /// @dev Only the owner of the contract can change the payment period.
    /// @param _paymentPeriod The new period (in seconds) for which domains will be registered.
    function changePaymentPeriod(uint _paymentPeriod) external onlyOwner {
        require(_paymentPeriod > 0, 'wrong payment period');
        paymentPeriod = _paymentPeriod;
        emit PaymentPeriodChanged(_paymentPeriod);
    }

    /// @notice Get information about a registered domain.
    /// @dev Allows users to retrieve information about a specific registered domain, including details such as the owner,
    /// creation date, and expiration date.
    /// @param _domain The domain name for which information is requested.
    /// @return A DomainRecord struct containing information about the domain.
    function domainInfo(string memory _domain) external view returns (DomainRecord memory) {
        require(!_onlyFreeDomain(_domain), 'free domain');
        return registryByName[_domain];
    }

    /// @notice Check if a domain is available for registration.
    /// @dev Allows users to check whether a specific domain name is available for registration, meaning it has not
    /// been reserved by another user and is not currently under reservation.
    /// @param _domain The domain name to check for availability.
    /// @return True if the domain is available for registration, false otherwise.
    function isFreeDomain(string memory _domain) external view returns (bool) {
        return _onlyFreeDomain(Utils.clearDomain(_domain));
    }

    /// @notice Get the owner of a registered domain.
    /// @dev Allows users to retrieve the address of the owner of a specific registered domain.
    /// @param _domain The domain name for which the owner's address is requested.
    /// @return The Ethereum address of the owner of the domain.
    function domainOwner(string memory _domain) external view returns (address) {
        return registryByName[_domain].owner;
    }

    /// @notice Get the price of a domain registration.
    /// @dev Allows users to retrieve the address of the owner of a specific registered domain.
    /// @param _domain The domain name for which the price's address is requested.
    /// @return price of the domain.
    function domainPrice(string memory _domain) external view returns (uint) {
        return registryByName[_domain].additionalPrice + mainPrice;
    }

    /// @notice Reserve a domain for a specified number of periods.
    /// @dev Allows users to reserve a domain by providing the domain name and the number of periods they want to
    /// reserve it for. The cost of the reservation is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name to be reserved.
    /// @param _periods The number of periods for which the domain will be reserved.
    function reserveDomain(string memory _domain, uint8 _periods, uint _additionalPrice) external payable {
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
        _record.additionalPrice = _additionalPrice;

        registryByName[_domain] = _record;
        emit DomainReserved(_msgSender(), _domain, _cost, _createdAt, _finishedAt);
    }

    /// @notice Change the additional price for domain registration.
    /// @dev Only owner of the domain can change the additional price.
    /// @param _domain The domain name for which the additional price will be changed.
    /// @param _additionalPrice The new additional price for domain registration.
    function changeAdditionPrice(string memory _domain, uint _additionalPrice) external {
        _domain = Utils.clearDomain(_domain);
        require(!_onlyFreeDomain(_domain), 'free domain');
        registryByName[_domain].additionalPrice = _additionalPrice;

        emit AdditionalPriceChanged(_msgSender(), _domain, _additionalPrice);
    }

    /// @notice Continue the reservation of an existing domain for additional periods.
    /// @dev Allows the owner of a previously reserved domain to extend the reservation by specifying the number of
    /// additional periods. The cost of the extension is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name for which the reservation will be extended.
    /// @param _periods The number of additional periods for which the domain will be reserved.
    function continueDomain(string memory _domain, uint8 _periods) external payable {
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

    /// @notice Process payments for domain reservations and extensions.
    /// @dev Internal function used to handle the payment processing for domain reservations and extensions.
    /// It calculates the cost of the reservation, verifies the provided value, and transfers funds to the contract's
    /// treasury address.
    /// @param _price The price of a single period of domain registration.
    /// @param _periods The number of periods for which the domain will be reserved or extended.
    /// @param _periodStartedAt The timestamp when the current period started.
    /// @return The timestamp when the reservation or extension period will end and the total cost of the transaction.
    function _paymentProcessing(string memory _parentDomain, uint _price, uint8 _periods, uint _periodStartedAt) internal returns (uint, uint) {
        uint _baseCost = _price * _periods;
        uint _totalCost = _baseCost;

        uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);

        if (bytes(_parentDomain).length > 0) {
            DomainRecord storage _parentRecord = registryByName[_parentDomain];
            _totalCost += _parentRecord.additionalPrice  * _periods;
            require(msg.value == _totalCost, 'wrong value');
            if(!_onlyFreeDomain(_parentDomain)){
                uint _fee = fee > 0 ? (_parentRecord.additionalPrice * _periods * fee) / 100 : 0;
                rewards[_parentRecord.owner] += _totalCost - _baseCost - _fee;
                rewards[treasure] += _baseCost + _fee;
                return (_finishedAt, _totalCost);
            }
        }else{
            require(msg.value == _totalCost, 'wrong value');
        }

        rewards[treasure] += _totalCost;
        return (_finishedAt, _totalCost);
    }

    /// @notice get reward for domain registration
    /// @dev Allows the owner of a contract or parent domain to withdraw reward for domain registration
    function withdrawReward() external {
        uint _reward = rewards[_msgSender()];
        require(_reward > 0, 'no reward');

        rewards[_msgSender()] = 0;

        (bool sent,) = _msgSender().call{value: _reward}('');
        require(sent, 'failed to send Ether');

        emit WithdrawReward(_msgSender(), _reward);
    }

    /// @notice Check if a domain is free and available for registration.
    /// @dev Internal function used to determine if a specific domain is available for registration, meaning it either
    /// has no owner or its reservation has expired.
    /// @param _domain The domain name to check for availability.
    /// @return True if the domain is free and available for registration, false otherwise.
    function _onlyFreeDomain(string memory _domain) internal view returns (bool) {
        return registryByName[_domain].owner == address(0) || block.timestamp > registryByName[_domain].finishedAt;
    }

    /// @notice Verify the ownership of a registered domain.
    /// @dev Internal function used to confirm that the caller is the rightful owner of a specific registered domain.
    /// It checks if the provided Ethereum address matches the owner's address of the domain.
    /// @param _domain The domain name to validate ownership for.
    function _validateDomainOwner(string memory _domain) internal view {
        require(registryByName[_domain].owner == _msgSender(), 'wrong sender');
    }
}
