//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../interfaces/IBaton.sol";

contract BatonMock is ERC721Enumerable, IBaton {
    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    function testMint(uint256 id) public {
        _mint(msg.sender, id);
    }

    function donate(uint256 tokenId) public payable {
        emit Donated(tokenId, msg.sender, msg.value);
    }
}
