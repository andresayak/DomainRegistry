// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/access/Ownable.sol';

contract TestToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, uint256 _totalSupply) ERC20(name_, symbol_) Ownable(_msgSender()) {
        _mint(_msgSender(), _totalSupply);
    }
}
