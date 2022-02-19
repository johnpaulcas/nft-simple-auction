// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.6;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction is IERC721Receiver, Ownable {
    IERC721 public immutable NFT;

    struct AuctionDetail {
        address seller;
        uint128 price;
        uint256 start;
        uint256 end;
        uint256 maxBid;
        address maxBidUser;
        bool isActive;
        uint256[] bidAmounts;
        address[] users;
    }

    // mapping(address => mapping(uint256 => AuctionDetail)) public tokenToAuction;
    mapping(uint256 => AuctionDetail) public tokenToAuction;

    // mapping(address => mapping(uint256 => mapping(address => uint256)))
    mapping(uint256 => mapping(address => uint256)) public bids;

    constructor(address _nft) {
        NFT = IERC721(_nft);
    }

    /**
     * @notice Put item in auction
     * @dev Auto-start when _start date is 0 or less than the current timestamp
     * @param _tokenId The item to list
     * @param _price The item price
     * @param _start Auction duration in seconds, days since the UNIX epoch (start of day).
     * @param _end Auction duration in seconds, days since the UNIX epoch (start of day).
     */
    function createTokenAuction(
        uint256 _tokenId,
        uint128 _price,
        uint256 _start,
        uint256 _end
    ) external onlyOwner {
        require(msg.sender != address(0), "Auction: Cannot be zero address");
        require(_price > 0, "Auction: Price cannot be zero");
        require(_end > block.timestamp, "Auction: Invalid end value");
        require(
            _start < _end,
            "Auction: Start date cannot be greater than or equal to end date"
        );

        address owner = msg.sender;
        NFT.safeTransferFrom(owner, address(this), _tokenId);
        tokenToAuction[_tokenId] = AuctionDetail({
            seller: msg.sender,
            price: uint128(_price),
            start: _start,
            end: _end,
            maxBid: 0,
            maxBidUser: address(0),
            isActive: true,
            bidAmounts: new uint256[](0),
            users: new address[](0)
        });
    }

    /**
     * @notice Allow user to bid on specific nft that is stored on this contract.
     * @param _tokenId The item to bid
     */
    function bid(uint256 _tokenId) external payable {
        AuctionDetail storage auction = tokenToAuction[_tokenId];
        require(
            msg.value >= auction.price,
            "Auction: bid price is less than current price"
        );
        // make sure is still active, this will become false when sold or cancelled
        require(auction.isActive, "Auction: Item no longer active");
        // make sure that auction already started
        require(
            auction.start <= block.timestamp,
            "Auction: auction not yet start"
        );
        // make sure that auction is not yet ended
        require(auction.end > block.timestamp, "Auction: Token auction end");

        bids[_tokenId][msg.sender] = msg.value;
        if (bids[_tokenId][msg.sender] > 0) {
            payable(address(this)).transfer(bids[_tokenId][msg.sender]);
        }

        if (auction.bidAmounts.length == 0) {
            auction.maxBid = msg.value;
            auction.maxBidUser = msg.sender;
        } else {
            uint256 lastIndex = auction.bidAmounts.length - 1;
            require(
                auction.bidAmounts[lastIndex] < msg.value,
                "Auction: Current max bid is higher than your bid"
            );
            auction.maxBid = msg.value;
            auction.maxBidUser = msg.sender;
        }
        auction.users.push(msg.sender);
        auction.bidAmounts.push(msg.value);
    }

    /**
     * @dev Called by the seller when the auction duration is over the hightest bid user get's
     * the nft and other bidders get eth back
     * @param _tokenId The tokenId of nft to be listed
     */
    function acceptOffer(uint256 _tokenId) external onlyOwner {
        AuctionDetail storage auction = tokenToAuction[_tokenId];
        require(
            auction.end <= block.timestamp,
            "Auction: Deadline did not pass yet"
        );
        // require(auction.seller == _msgSender(), "Auction: Not seller");
        require(auction.isActive, "Auction: auction not active");

        auction.isActive = false;
        if (auction.bidAmounts.length == 0) {
            // if no bid, just return the NFT to seller
            NFT.safeTransferFrom(address(this), auction.seller, _tokenId);
        } else {
            // tranfer the max bid to seller
            payable(auction.seller).transfer(auction.maxBid);
            for (uint256 i = 0; i < auction.users.length; i++) {
                if (auction.users[i] != auction.maxBidUser) {
                    // Return bid amount to participant
                    payable(auction.users[i]).transfer(
                        bids[_tokenId][auction.users[i]]
                    );
                }
            }
            NFT.safeTransferFrom(address(this), auction.maxBidUser, _tokenId);
        }
    }

    /**
     * @notice When user cancel the auction the participant get back their eth
     * @param _tokenId The token ID to cancel
     */
    function cancelAuction(uint256 _tokenId) external {
        AuctionDetail storage auction = tokenToAuction[_tokenId];
        require(auction.seller == msg.sender, "Auction: Not seller");
        require(auction.isActive, "Auction: auction not active");
        auction.isActive = false;
        for (uint256 i = 0; i < auction.users.length; i++) {
            // Return back the eth of bid token participant
            payable(auction.users[i]).transfer(
                bids[_tokenId][auction.users[i]]
            );
        }
        // Return nft token to seller
        NFT.safeTransferFrom(address(this), auction.seller, _tokenId);
    }

    function getTokenAuctionDetails(uint256 _tokenId)
        public
        view
        returns (AuctionDetail memory)
    {
        AuctionDetail memory auction = tokenToAuction[_tokenId];
        return auction;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }

    receive() external payable {}
}
