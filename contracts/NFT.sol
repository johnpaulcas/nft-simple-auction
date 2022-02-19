// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    string public baseURI;

    mapping(address => bool) public trustedOperators;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        for (uint256 token = 0; token < 3; token++) {
            _safeMint(_msgSender(), totalSupply() + 1);
        }
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

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
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
        _safeMint(_to, totalSupply() + 1);
    }

    /**
     * @dev Set base URI
     * @param baseURI_ the new baseURI
     */
    function setBaseURI(string memory baseURI_) public onlyOwner {
        baseURI = baseURI_;
    }

    /**
     * @dev Flip trusted operator state
     * @param _operator The trusted operator state to flip
     */
    function flipTrustedOperatorState(address _operator) public onlyOwner {
        trustedOperators[_operator] = !trustedOperators[_operator];
    }
}
