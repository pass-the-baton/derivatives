//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IBaton {
    event Donated(
        uint256 indexed tokenId,
        address indexed donor,
        uint256 amount
    );
}
