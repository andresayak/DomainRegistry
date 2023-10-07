// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import './LibUtils.sol';
import './LibUtilsV2.sol';

contract ContractForTest {
    event Test(string text);

    function substrV1(string memory _str, uint _startIndex, uint _endIndex) external{
        bytes memory _strBytes = bytes(_str);
        emit Test(string(UtilsV1.substr(_strBytes, _startIndex, _endIndex)));
    }

    function substrV2(string memory _str, uint _startIndex, uint _endIndex) external{
        bytes memory _strBytes = bytes(_str);
        emit Test(string(Utils.substr(_strBytes, _startIndex, _endIndex)));
    }

    function clearDomainV1(string memory _domain) external{
        emit Test(UtilsV1.clearDomain(_domain));
    }

    function clearDomainV2(string memory _domain) external{
        emit Test(Utils.clearDomain(_domain));
    }

    function parentDomainV1(string memory _domain) external{
        emit Test(UtilsV1.parentDomain(_domain));
    }

    function parentDomainV2(string memory _domain) external{
        emit Test(Utils.parentDomain(_domain));
    }
}
