// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    string public baseURI;

    Counters.Counter private _nextTokenId;
    mapping(address => bool) public trustedOperators;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        _nextTokenId.increment();
    }

    /**
     * @dev _nextTokenId ahead +1 so to get the total supply of token it must be -1
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId.current() - 1;
    }

    /**
     * @dev Return complete token URI
     * @param _tokenId The tokenId
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "Token does not exist.");
        return string(abi.encodePacked(baseURI, Strings.toString(_tokenId)));
    }

    function isApprovedForAll(address _owner, address operator)
        public
        view
        override
        returns (bool)
    {
        // Allow access for trusted operator to save gas
        if (trustedOperators[operator]) return true;
        return super.isApprovedForAll(_owner, operator);
    }

    /**
     * @dev Mint token to specified address can access only by contract owner
     * @param _to The address where to mint the token
     */
    function mintTo(address _to) external onlyOwner {
        uint256 currentTokenId = _nextTokenId.current();
        _nextTokenId.increment();
        _safeMint(_to, currentTokenId);
    }

    /**
     * @dev Set base URI
     * @param _baseURI the new baseURI
     */
    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    /**
     * @dev Flip trusted operator state
     * @param _operator The trusted operator state to flip
     */
    function flipTrustedOperatorState(address _operator) public onlyOwner {
        trustedOperators[_operator] = !trustedOperators[_operator];
    }
}
