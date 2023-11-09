// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import './LibUtils.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
//import "hardhat/console.sol";

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
    //tokenAddress => priceFeedAddress
    mapping(address => AggregatorV3Interface) public baseTokens;
    AggregatorV3Interface public baseAggregator;
    //userAddress => tokenAddress => amount
    mapping(address => mapping(address => uint)) public tokenRewards;

    event DomainReserved(address indexed sender, string indexed domainTopic, string domain, uint additionalPrice, uint createdAt, uint finishedAt);
    event DomainContinue(address indexed sender, string indexed domainTopic, string domain, uint finishedAt);
    event TreasureChanged(address treasure);
    event MainPriceChanged(uint mainPrice);
    event PaymentPeriodChanged(uint paymentPeriod);
    event FeeChanged(uint fee);
    event WithdrawReward(address indexed account, uint amount);
    event WithdrawRewardToken(address indexed account, address indexed token, uint amount);
    event RewardAdded(address indexed account, uint amount);
    event RewardAddedToken(address indexed account, address token, uint amount);
    event AdditionalPriceChanged(address indexed sender, string indexed domainTopic, string domain, uint amount);
    event BaseTokenAdded(address indexed token, address feed);
    event BaseTokenRemoved(address indexed token);

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

    function initializeV3(uint _mainPriceInUSD, AggregatorV3Interface _baseAggregator, address[] memory _baseTokens, address[] memory _feeds) public reinitializer(3){
        _addBaseTokens(_baseTokens, _feeds);
        mainPrice = _mainPriceInUSD;
        baseAggregator = _baseAggregator;
    }

    function getPriceInEth(uint _amount) public view returns (uint){
        (uint _price, uint8 _tokenDecimals) = _getEthPrice();
        return (_amount * ( 10 ** _tokenDecimals)) / _price;
    }

    function getPriceInToken(address _tokenAddress, uint _amount) public view returns (uint){
        require(baseTokens[_tokenAddress] != AggregatorV3Interface(address(0)), 'token not in whitelist');
        (uint _tokenPrice, uint8 _tokenDecimals) = _getPriceAndDecimals(_tokenAddress);
        return (_amount * ( 10 ** _tokenDecimals)) / _tokenPrice;
    }

    function addBaseTokens(address[] memory _baseTokens, address[] memory _feeds) public virtual onlyOwner{
        _addBaseTokens(_baseTokens, _feeds);
    }

    function removeBaseToken(address _tokenAddress) external virtual onlyOwner {
        baseTokens[_tokenAddress] = AggregatorV3Interface(address(0));
        emit BaseTokenRemoved(_tokenAddress);
    }

    function _getEthPrice() internal view virtual returns (uint, uint8) {
        (/* uint80 roundID */,
            int _price,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/) = baseAggregator.latestRoundData();
        uint8 _decimals = baseAggregator.decimals();
        return (uint(_price), _decimals);
    }

    function _getPriceAndDecimals(address _tokenAddress) internal view virtual returns (uint, uint8) {
        (/* uint80 roundID */,
            int _price,
        /*uint startedAt*/,
        /*uint timeStamp*/,
        /*uint80 answeredInRound*/) = baseTokens[_tokenAddress].latestRoundData();
        uint8 _decimals = baseTokens[_tokenAddress].decimals();
        return (uint(_price), _decimals);
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

    /// @notice Get the token reward of a domain's owner.
    /// @param _account The domain owner
    /// @param _tokenAddress The token address
    /// @return reward.
    function rewardByToken(address _account, address _tokenAddress) external view returns(uint){
        return tokenRewards[_account][_tokenAddress];
    }

    /// @notice Reserve a domain for a specified number of periods.
    /// @dev Allows users to reserve a domain by providing the domain name and the number of periods they want to
    /// reserve it for. The cost of the reservation is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name to be reserved.
    /// @param _periods The number of periods for which the domain will be reserved.
    /// @param _additionalPrice The additional price for domain registration.
    function reserveDomain(string memory _domain, uint8 _periods, uint _additionalPrice) external virtual payable noReentrant{
        _domain = Utils.clearDomain(_domain);
        require(_onlyFreeDomain(_domain), 'not free domain');
        require(_periods > 0, 'wrong periods');
        string memory _parentDomain = Utils.parentDomain(_domain);
        if (bytes(_parentDomain).length > 0) {
            require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
        }
        uint _createdAt = block.timestamp;
        (uint _finishedAt) = _paymentProcessing(_parentDomain, _periods, _createdAt);

        DomainRecord memory _record;
        _record.owner = _msgSender();
        _record.createdAt = _createdAt;
        _record.finishedAt = _finishedAt;
        _record.additionalPrice = _additionalPrice;

        registryByName[_domain] = _record;
        emit DomainReserved(_msgSender(), _domain, _domain, _additionalPrice, _createdAt, _finishedAt);
    }

    /// @notice Reserve a domain for a specified number of periods.
    /// @dev Allows users to reserve a domain by providing the domain name and the number of periods they want to
    /// reserve it for. The cost of the reservation is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name to be reserved.
    /// @param _periods The number of periods for which the domain will be reserved.
    /// @param _tokenAddress
    /// @param _additionalPrice The additional price for domain registration.
    function reserveDomainByToken(string memory _domain, uint8 _periods, address _tokenAddress, uint _additionalPrice) external virtual {
        _domain = Utils.clearDomain(_domain);

        require(_onlyFreeDomain(_domain), 'not free domain');
        require(_periods > 0, 'wrong periods');

        string memory _parentDomain = Utils.parentDomain(_domain);
        if (bytes(_parentDomain).length > 0) {
            require(!_onlyFreeDomain(_parentDomain), 'parent domain is free');
        }
        uint _createdAt = block.timestamp;

        DomainRecord memory _record;
        _record.owner = _msgSender();
        _record.createdAt = _createdAt;
        _record.finishedAt = _paymentProcessingToken(_parentDomain, _tokenAddress, _periods, _createdAt);
        _record.additionalPrice = _additionalPrice;

        registryByName[_domain] = _record;
        emit DomainReserved(_msgSender(), _domain, _domain, _additionalPrice, _createdAt, _record.finishedAt);
    }

    /// @notice Extend the reservation of an existing domain for additional periods.
    /// @dev Allows the owner of a previously reserved domain to extend the reservation by specifying the number of
    /// additional periods. The cost of the extension is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name for which the reservation will be extended.
    /// @param _periods The number of additional periods for which the domain will be reserved.
    function continueDomainByToken(string memory _domain, uint8 _periods, address _tokenAddress) external {
        _domain = Utils.clearDomain(_domain);
        _validateDomainOwner(_domain);
        require(_periods > 0, 'wrong periods');
        string memory _parentDomain = Utils.parentDomain(_domain);
        DomainRecord storage _record = registryByName[_domain];

        uint _createdAt = _record.finishedAt;
        _record.finishedAt = _paymentProcessingToken(_parentDomain, _tokenAddress, _periods, _createdAt);
        emit DomainContinue(_msgSender(), _domain, _domain, _record.finishedAt);
    }

    /// @notice Change the additional price for domain registration.
    /// @dev Only owner of the domain can change the additional price.
    /// @param _domain The domain name for which the additional price will be changed.
    /// @param _additionalPrice The new additional price for domain registration.
    function changeAdditionPrice(string memory _domain, uint _additionalPrice) external {
        _domain = Utils.clearDomain(_domain);
        require(!_onlyFreeDomain(_domain), 'free domain');
        registryByName[_domain].additionalPrice = _additionalPrice;

        emit AdditionalPriceChanged(_msgSender(), _domain, _domain, _additionalPrice);
    }

    /// @notice Continue the reservation of an existing domain for additional periods.
    /// @dev Allows the owner of a previously reserved domain to extend the reservation by specifying the number of
    /// additional periods. The cost of the extension is calculated based on the main price and the specified number
    /// of periods.
    /// @param _domain The domain name for which the reservation will be extended.
    /// @param _periods The number of additional periods for which the domain will be reserved.
    function continueDomain(string memory _domain, uint8 _periods) external payable noReentrant {
        _domain = Utils.clearDomain(_domain);
        _validateDomainOwner(_domain);
        require(_periods > 0, 'wrong periods');
        string memory _parentDomain = Utils.parentDomain(_domain);
        DomainRecord storage _record = registryByName[_domain];

        uint _createdAt = _record.finishedAt;
        _record.finishedAt = _paymentProcessing(_parentDomain, _periods, _createdAt);
        emit DomainContinue(_msgSender(), _domain, _domain, _record.finishedAt);
    }

    /// @notice Process payments for domain reservations and extensions.
    /// @dev Internal function used to handle the payment processing for domain reservations and extensions.
    /// It calculates the cost of the reservation, verifies the provided value, and transfers funds to the contract's
    /// treasury address.
    /// @param _periods The number of periods for which the domain will be reserved or extended.
    /// @param _periodStartedAt The timestamp when the current period started.
    /// @return The timestamp when the reservation or extension period will end and the total cost of the transaction.
    function _paymentProcessing(string memory _parentDomain, uint8 _periods, uint _periodStartedAt) internal returns (uint) {
        uint _baseCost = getPriceInEth(mainPrice * _periods) ;
        uint _totalCost = _baseCost;

        uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);

        if (bytes(_parentDomain).length > 0) {
            DomainRecord storage _parentRecord = registryByName[_parentDomain];
            uint _additionCost = getPriceInEth(_parentRecord.additionalPrice  * _periods);
            _totalCost += _additionCost;
            require(msg.value >= _totalCost, 'wrong value');
            if(!_onlyFreeDomain(_parentDomain)){
                uint _fee = fee > 0 ? (_additionCost * fee) / 100 : 0;
                uint _ownerReward = _totalCost - _baseCost - _fee;
                uint _treasureReward = _totalCost - _ownerReward;
                rewards[_parentRecord.owner] += _ownerReward;
                rewards[treasure] += _treasureReward;

                emit RewardAdded(_parentRecord.owner, _ownerReward);
                emit RewardAdded(treasure, _treasureReward);

                return _finishedAt;
            }
        }else{
            require(msg.value >= _totalCost, 'wrong value');
            rewards[treasure] += _totalCost;

            emit RewardAdded(treasure, _totalCost);
        }

        if(msg.value > _totalCost){
            (bool sent,) = _msgSender().call{value: msg.value - _totalCost}('');
            require(sent, 'failed to send Ether');
        }

        return _finishedAt;
    }

    /// @notice get reward for domain registration
    /// @dev Allows the owner of a contract or parent domain to withdraw reward for domain registration
    function withdrawReward(address _account) external {
        uint _reward = rewards[_account];
        require(_reward > 0, 'no reward');

        rewards[_account] = 0;

        (bool sent,) = _account.call{value: _reward}('');
        require(sent, 'failed to send Ether');

        emit WithdrawReward(_account, _reward);
    }

    /// @notice Withdraw accrued rewards.
    /// @dev Allows users to withdraw any rewards they have earned for referring others to register domains.
    /// The rewards are accumulated in the `rewards` mapping and can be withdrawn as Ether.
    function withdrawRewardToken(address _account, address _tokenAddress) external virtual {
        uint _rewardInToken = tokenRewards[_account][_tokenAddress];
        require(_rewardInToken > 0, 'no reward');

        tokenRewards[_account][_tokenAddress] = 0;
        assert(IERC20(_tokenAddress).transfer(_account , _rewardInToken));

        emit WithdrawRewardToken(_account, _tokenAddress, _rewardInToken);
    }

    /// @notice Process payments for domain reservations and extensions.
    /// @dev Internal function used to handle the payment processing for domain reservations and extensions.
    /// It calculates the cost of the reservation, verifies the provided value, and transfers funds to the contract's
    /// treasury address.
    /// @param _parentDomain The parent domain that will receive the reward
    /// @param _periods The number of periods for which the domain will be reserved or extended.
    /// @param _periodStartedAt The timestamp when the current period started.
    /// @return The timestamp when the reservation or extension period will end and the total cost of the transaction.
    function _paymentProcessingToken(string memory _parentDomain, address _tokenAddress, uint8 _periods, uint _periodStartedAt)
    internal
    virtual
    returns (uint)
    {
        uint _baseCost = getPriceInToken(_tokenAddress, mainPrice * _periods) ;
        uint _totalCost = _baseCost;

        uint _finishedAt = _periodStartedAt + (paymentPeriod * _periods);

        if (bytes(_parentDomain).length > 0) {
            DomainRecord storage _parentRecord = registryByName[_parentDomain];
            uint _additionCost = getPriceInToken(_tokenAddress, _parentRecord.additionalPrice  * _periods);
            _totalCost += _additionCost;
            assert(IERC20(_tokenAddress).transferFrom(_msgSender(), address(this) , _totalCost));
            if(!_onlyFreeDomain(_parentDomain)){

                uint _fee = fee > 0 ? (_additionCost * fee) / 100 : 0;
                uint _ownerReward = _totalCost - _baseCost - _fee;
                uint _treasureReward = _totalCost - _ownerReward;
                tokenRewards[_parentRecord.owner][_tokenAddress] += _ownerReward;
                tokenRewards[treasure][_tokenAddress] += _treasureReward;

                emit RewardAddedToken(_parentRecord.owner, _tokenAddress, _ownerReward);
                emit RewardAddedToken(treasure, _tokenAddress, _treasureReward);

                return _finishedAt;
            }
        }else{
            assert(IERC20(_tokenAddress).transferFrom(_msgSender(), address(this) , _totalCost));
            tokenRewards[treasure][_tokenAddress] += _totalCost;

            emit RewardAddedToken(treasure, _tokenAddress, _totalCost);
        }

        return _finishedAt;
    }

    function _addBaseTokens(address[] memory _baseTokens, address[] memory _feeds) internal virtual{
        require(_baseTokens.length == _feeds.length, 'wrong feeds length');
        for(uint _i = 0; _i < _baseTokens.length; _i++){
            baseTokens[_baseTokens[_i]] = AggregatorV3Interface(_feeds[_i]);
            emit BaseTokenAdded(_baseTokens[_i], _feeds[_i]);
        }
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
