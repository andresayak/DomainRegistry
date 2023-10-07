// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

library Utils {
  function parentDomain(string memory _domain) internal pure returns (string memory _parentDomain) {
    bytes memory _domainBytes = bytes(_domain);
    bytes memory _dotBytes = bytes('.');

    require(_domainBytes.length != 0, 'empty domain');

    _parentDomain = '';
    for (uint i = 0; i < _domainBytes.length; i++) {
      if (_domainBytes[i] == _dotBytes[0]) {
        uint _startIndex = i + 1;
        _parentDomain = string(substr(_domainBytes, _startIndex, _domainBytes.length));
        break;
      }
    }
  }

  function clearDomain(string memory _domain) internal pure returns (string memory) {
    bytes memory _domainBytes = bytes(_domain);
    bytes memory _prefixBytes = bytes('://');

    if (_domainBytes.length >= _prefixBytes.length) {
      for (uint i = 0; i < _domainBytes.length - _prefixBytes.length; i++) {
        bool _found = true;
        for (uint j = 0; j < _prefixBytes.length; j++) {
          if (_domainBytes[i+j] != _prefixBytes[j]) {
            _found = false;
            break;
          }
        }
        if (_found) {
          uint _startIndex = i + _prefixBytes.length;
          _domain = string(substr(_domainBytes, _startIndex, _domainBytes.length));
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
