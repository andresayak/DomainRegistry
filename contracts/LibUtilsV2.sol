// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
//import "hardhat/console.sol";

library Utils {

  function parentDomain(string memory _domain) internal pure returns (string memory _parentDomain) {
    bytes memory _domainBytes = bytes(_domain);
    bytes1 _dotByte = bytes1('.');

    uint _length = _domainBytes.length;
    require(_length != 0, 'empty domain');

    _parentDomain = '';
    for (uint i = 0; i < _length; i++) {
      bool result;
      assembly {
        let a1 := byte(i, mload(add(_domainBytes, 0x20)))
        let b1 := byte(0, _dotByte)
        result := eq(a1, b1)
      }
      if (result) {
        _parentDomain = string(substr(_domainBytes, i + 1, _length));
        break;
      }
    }
  }


  function clearDomain(string memory _domain) internal pure returns (string memory) {
    bytes memory _domainBytes = bytes(_domain);
    bytes memory _prefixBytes = bytes('://');
    uint _lengthDomain = _domainBytes.length;
    uint _lengthPrefix = _prefixBytes.length;

    if (_lengthDomain >= _lengthPrefix) {
      for (uint i = 0; i < _lengthDomain - _lengthPrefix; i++) {
        bool _found = true;
        for (uint j = 0; j < _lengthPrefix; j++) {
          bool result;
          assembly {
            let a := byte(add(i, j), mload(add(_domainBytes, 0x20)))
            let b := byte(j, mload(add(_prefixBytes, 0x20)))
            result := eq(a, b)
          }

          if (!result) {
            _found = false;
            break;
          }
        }
        if (_found) {
          _domain = string(substr(_domainBytes, i + _lengthPrefix, _lengthDomain));
        }
      }
    }
    return _domain;
  }

  function substr(bytes memory _strBytes, uint _startIndex, uint _endIndex) internal pure returns (bytes memory _result) {
    require(_startIndex <= _endIndex, "Invalid start and end indices");
    uint _length = _endIndex - _startIndex;
    assembly {
      _result := mload(0x40)
      mstore(_result, _length)
      let dest := add(_result, 0x20)

      for {
        let i := _startIndex
      } lt(i, _endIndex) {
        i := add(i, 1)
      } {
        mstore8(dest, mload(add(_strBytes, add(i, 1))))
        dest := add(dest, 1)
      }
      mstore(0x40, add(_result, add(0x20, _length)))
    }
  }
}
