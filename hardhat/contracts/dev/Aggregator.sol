// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import '@openzeppelin/contracts/access/Ownable.sol';

contract Aggregator is Ownable, AggregatorV3Interface {
    int256 answer;
    uint8 _decimals;

    constructor(int256 _answer, uint8 decimals_) Ownable(_msgSender()) {
        answer = _answer;
        _decimals = decimals_;
    }

    function setAnswer(int256 _answer) external{
        answer = _answer;
    }

    function decimals() external view returns (uint8){
        return _decimals;
    }

    function description() external view returns (string memory){
        return '';
    }

    function version() external view returns (uint256){
        return 0;
    }

    function getRoundData(
        uint80
    ) external view returns (uint80, int256, uint256, uint256, uint80){
        return (0, answer, 0, 0, 0);
    }

    function latestRoundData()
    external
    view
    returns (uint80, int256, uint256, uint256, uint80){
        return (0, answer, 0, 0, 0);
    }
}
