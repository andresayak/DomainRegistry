// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './LibUtils.sol';
import './LibUtilsV2.sol';

contract ContractForTest {
    event Test(string text);

    function substrV1(string memory _str, uint _startIndex, uint _endIndex) pure external returns (string memory){
        bytes memory _strBytes = bytes(_str);
        return string(UtilsV1.substr(_strBytes, _startIndex, _endIndex));
    }

    function substrV2(string memory _str, uint _startIndex, uint _endIndex) pure external returns (string memory){
        bytes memory _strBytes = bytes(_str);
        return string(Utils.substr(_strBytes, _startIndex, _endIndex));
    }

    function clearDomainV1(string memory _domain) pure external returns (string memory){
        return UtilsV1.clearDomain(_domain);
    }

    function clearDomainV2(string memory _domain) pure external returns (string memory){
        return Utils.clearDomain(_domain);
    }
}
