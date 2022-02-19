const { expect } = require("chai");
const { ethers } = require("hardhat");

const { latestTime } = require("./helpers/latestTime");

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");

const NAME = "NFT Test";
const SYMBOL = "TEST";

describe("Auction", () => {
  beforeEach(async () => {
    [this.owner, this.addr1, this.other] = await ethers.getSigners();
    const MockNFT = await ethers.getContractFactory("NFT");
    const Auction = await ethers.getContractFactory("Auction");

    this.nft = await MockNFT.deploy(NAME, SYMBOL);
    await this.nft.deployed();

    this.auction = await Auction.deploy(this.nft.address);
    await this.auction.deployed();
  });

  it("should have the right name", async () => {
    expect(await this.nft.name()).to.equal(NAME);
  });

  it("should have the right symbol", async () => {
    expect(await this.nft.symbol()).to.equal(SYMBOL);
  });

  describe("Create Auctions", () => {
    beforeEach(async () => {
      await this.nft.mintTo(this.owner.address);
      await this.nft.flipTrustedOperatorState(this.auction.address);
    });

    it("should have the right balance", async () => {
      expect(await this.nft.balanceOf(this.owner.address)).to.equal(1);
    });

    it("should be able to createTokenAuction", async () => {
      const blockTimestamp = await latestTime();
      const start = blockTimestamp + 86400; // add 1 day
      const end = blockTimestamp + 86400 * 2; // add 2 day

      await this.auction.createTokenAuction(
        1, // token id,
        ethers.utils.parseEther("0.5"),
        start, // start time
        end // end time
      );

      const [
        seller,
        price,
        startTimestamp,
        endTimestap,
        maxBid,
        ,
        isActive,
        ,
        ,
      ] = await this.auction.getTokenAuctionDetails(1);

      expect(seller).to.equal(this.owner.address);
      expect(price).to.equal(ethers.utils.parseEther("0.5"));
      expect(startTimestamp).to.equal(start);
      expect(endTimestap).to.equal(end);
      expect(maxBid).to.equal(0);
      expect(isActive).to.equal(true);
    });
  });
});
