//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract PTBExclusiveDrop is ERC721Enumerable, Ownable, VRFConsumerBase {
    uint256 public immutable MAX_SUPPLY;

    string public contractURI;
    uint256 public claimableUntil;
    uint256 public mintableUntil;
    bytes32 public airdropRoot;
    mapping(address => bool) public claimed;
    bytes32 public vrfReqId;
    uint256 public randomness;

    bytes32 private _vrfKeyHash;
    uint256 private _vrfFee;
    string private _dirHash;
    string private _mask;
    bytes32 private _reqId;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory mask_,
        bytes32 airdropRoot_,
        uint256 maxSupply_,
        address vrfCoordinator_,
        bytes32 vrfKeyHash_,
        uint256 vrfFee_,
        address link_,
        uint256 claimableUntil_,
        uint256 mintableUntil_
    ) ERC721(name_, symbol_) VRFConsumerBase(vrfCoordinator_, link_) Ownable() {
        _mask = mask_;
        MAX_SUPPLY = maxSupply_;
        airdropRoot = airdropRoot_;
        _vrfKeyHash = vrfKeyHash_;
        _vrfFee = vrfFee_;
        claimableUntil = claimableUntil_;
        mintableUntil = mintableUntil_;
    }

    function claim(bytes32[] memory proof) public {
        bytes32 leaf = bytes32(uint256(uint160(msg.sender)));
        require(!claimed[msg.sender], "Already claimed");
        require(block.timestamp < claimableUntil, "Not claimable");
        require(
            MerkleProof.verify(proof, airdropRoot, leaf),
            "MerkleProof is not valid"
        );
        claimed[msg.sender] = true;
        _safeMint(msg.sender);
    }

    function mintUnclaimed(address[] memory recipients) public onlyOwner {
        require(block.timestamp > claimableUntil, "Still claimable");
        for (uint256 i = 0; i < recipients.length; i += 1) {
            address to = recipients[i];
            _safeMint(to);
        }
    }

    function prepReveal(string memory dirHash_) public onlyOwner {
        require(
            mintableUntil < block.timestamp,
            "Please reveal after the minting."
        );
        require(bytes(_dirHash).length == 0, "Already revealed");
        _dirHash = dirHash_;
    }

    function reveal() public onlyOwner {
        require(bytes(_dirHash).length != 0, "Empty Metadata");
        require(randomness == 0, "Already revealed");
        require(LINK.balanceOf(address(this)) >= _vrfFee, "Not enough LINK");
        vrfReqId = requestRandomness(_vrfKeyHash, _vrfFee);
    }

    function updateContractURI(string memory uri_) public onlyOwner {
        contractURI = uri_;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (randomness == 0) return _mask;
        uint256 total = totalSupply();
        uint256 offset = randomness % total;
        uint256 offsetId = (tokenId + offset) < total
            ? (tokenId + offset)
            : (tokenId + offset) - total;
        return super.tokenURI(offsetId);
    }

    function fulfillRandomness(bytes32 requestId_, uint256 randomness_)
        internal
        override
    {
        require(mintableUntil < block.timestamp, "Still mintable.");
        require(vrfReqId == requestId_, "Request IDs aren't matched.");
        randomness = randomness_;
    }

    function _safeMint(address to) internal {
        uint256 tokenId = totalSupply();
        require(tokenId < MAX_SUPPLY, "Out of range");
        require(block.timestamp < mintableUntil, "Not mintable.");
        super._safeMint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _dirHash;
    }
}
