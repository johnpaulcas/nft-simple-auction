const { expect } = require('chai')
const { ethers, waffle } = require('hardhat')

const { currentTime, fastForwardTo } = require('./helpers/blockchain')(
  waffle.provider
)

const { constants } = require('@openzeppelin/test-helpers')

const { ZERO_ADDRESS } = constants

const NAME = 'NFT Test'
const SYMBOL = 'TEST'

describe('Auction', () => {
  const DAY = 86400
  const ONE_MONTH = DAY * 30

  let owner, addr1, other

  let nft
  let auction

  beforeEach(async () => {
    ;[owner, addr1, other] = await ethers.getSigners()
    const MockNFT = await ethers.getContractFactory('NFT')
    const Auction = await ethers.getContractFactory('Auction')

    nft = await MockNFT.deploy(NAME, SYMBOL)
    await nft.deployed()

    auction = await Auction.deploy(nft.address)
    await auction.deployed()
  })

  async function createAuction(tokenId, start, end, startPrice) {
    await auction.connect(owner).createTokenAuction(
      tokenId, // token id,
      ethers.utils.parseEther(startPrice),
      start, // start time
      end // end time
    )

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
    ] = await auction.getTokenAuctionDetails(tokenId)

    expect(seller).to.equal(owner.address)
    expect(price).to.equal(ethers.utils.parseEther(startPrice))
    expect(startTimestamp).to.equal(start)
    expect(endTimestap).to.equal(end)
    expect(maxBid).to.equal(0)
    expect(isActive).to.equal(true)
  }

  it('should have the right name', async () => {
    expect(await nft.name()).to.equal(NAME)
  })

  it('should have the right symbol', async () => {
    expect(await nft.symbol()).to.equal(SYMBOL)
  })

  it('should be able to transfer auction ownership', async function () {
    await auction.connect(owner).transferOwnership(addr1.address)
    expect(await auction.owner()).to.equal(addr1.address)
  })

  describe('Create Auctions', () => {
    beforeEach(async () => {
      await nft.flipTrustedOperatorState(auction.address)
    })

    it('should have the right balance', async () => {
      expect(await nft.balanceOf(owner.address)).to.equal(3)
    })

    it('should be able to createTokenAuction', async () => {
      const blockTimestamp = await currentTime()
      const start = blockTimestamp + DAY // add 1 day
      const end = blockTimestamp + DAY * 2 // add 2 day

      await auction.createTokenAuction(
        1, // token id,
        ethers.utils.parseEther('0.5'),
        start, // start time
        end // end time
      )

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
      ] = await auction.getTokenAuctionDetails(1)

      expect(seller).to.equal(owner.address)
      expect(price).to.equal(ethers.utils.parseEther('0.5'))
      expect(startTimestamp).to.equal(start)
      expect(endTimestap).to.equal(end)
      expect(maxBid).to.equal(0)
      expect(isActive).to.equal(true)
    })

    it('should fail if start > end', async function () {
      const blockTimestamp = await currentTime()
      const start = blockTimestamp + DAY * 2
      const end = blockTimestamp + DAY
      await expect(
        auction.createTokenAuction(
          1, // token id,
          ethers.utils.parseEther('0.5'),
          start, // start time
          end // end time
        )
      ).to.be.revertedWith(
        'Auction: Start date cannot be greater than or equal to end date'
      )
    })

    it('should fail if end is less than the current block timestamp', async function () {
      const blockTimestamp = await currentTime()
      const start = 0
      const end = blockTimestamp - DAY
      await expect(
        auction.createTokenAuction(
          1, // token id,
          ethers.utils.parseEther('0.5'),
          start, // start time
          end // end time
        )
      ).to.be.revertedWith('Auction: Invalid end value')
    })

    it('should fail when auction price start to 0', async function () {
      const blockTimestamp = await currentTime()
      const start = blockTimestamp + DAY
      const end = blockTimestamp + DAY * 2
      await expect(
        auction.createTokenAuction(
          1,
          0, // zero
          start,
          end
        )
      ).to.be.revertedWith('Auction: Price cannot be zero')
    })
  })

  describe('Bid', async function () {
    beforeEach(async () => {
      await nft.flipTrustedOperatorState(auction.address)
    })

    it('should be able to create auction', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      await createAuction(tokenId, start, end, startPrice)
    })

    it('should be able to bid', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      const bidPrice = '0.6'

      await createAuction(tokenId, start, end, startPrice)

      // move timestamp to bid start time
      await fastForwardTo(start) // blockTimestamp + ONE_MONTH

      await auction.connect(addr1).bid(tokenId, {
        from: addr1.address,
        value: ethers.utils.parseEther(bidPrice),
      })

      const [, , , , maxBid, maxBidUser, , , ,] =
        await auction.getTokenAuctionDetails(tokenId)

      expect(ethers.utils.parseEther(bidPrice)).to.equal(maxBid)
    })

    it('should fail if bid price < min price', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      const bidPrice = '0.4' // less min bid

      await createAuction(tokenId, start, end, startPrice)

      // move timestamp to bid start time
      await fastForwardTo(start) // blockTimestamp + ONE_MONTH

      await expect(
        auction.connect(addr1).bid(tokenId, {
          from: addr1.address,
          value: ethers.utils.parseEther(bidPrice),
        })
      ).to.be.revertedWith('Auction: bid price is less than current price')
    })

    it('should fail if current blocktime is less than start auction (block.timestamp < start)', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      const bidPrice = '0.6' // less min bid

      await createAuction(tokenId, start, end, startPrice)

      await expect(
        auction.connect(addr1).bid(tokenId, {
          from: addr1.address,
          value: ethers.utils.parseEther(bidPrice),
        })
      ).to.be.revertedWith('Auction: auction not yet start')
    })

    it('should fail when auction ended', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      const bidPrice = '0.6' // less min bid

      await createAuction(tokenId, start, end, startPrice)

      // moved to end auction time
      await fastForwardTo(end)

      await expect(
        auction.connect(addr1).bid(tokenId, {
          from: addr1.address,
          value: ethers.utils.parseEther(bidPrice),
        })
      ).to.be.revertedWith('Auction: Token auction end')
    })
  })

  describe('AcceptOffer', function () {
    beforeEach(async () => {
      await nft.flipTrustedOperatorState(auction.address)
    })

    it('should be able to create auction', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      await createAuction(tokenId, start, end, startPrice)
    })

    it('should be able to accept offer', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'
      const bidPrice = '0.6'

      await createAuction(tokenId, start, end, startPrice)

      // fast forward to bid start
      await fastForwardTo(start)

      // create bid
      await auction.connect(addr1).bid(tokenId, {
        from: addr1.address,
        value: ethers.utils.parseEther(bidPrice),
      })
      const [, , , , maxBid, maxBidUser, , , ,] =
        await auction.getTokenAuctionDetails(tokenId)
      expect(ethers.utils.parseEther(bidPrice)).to.equal(maxBid)
      expect(maxBidUser).to.equal(addr1.address)

      // fast to end bid date
      const latestTimestamp = await currentTime()
      await fastForwardTo(latestTimestamp + ONE_MONTH)

      const preBalance = await waffle.provider.getBalance(owner.address)
      await auction.acceptOffer(tokenId)
      const postBalance = await waffle.provider.getBalance(owner.address)
      expect(postBalance).to.gt(preBalance)
      const tokenIdToCheck = await nft.tokenOfOwnerByIndex(addr1.address, 0)
      expect(tokenIdToCheck).to.equal(tokenId)
    })

    it('should not be able to accept offer when auction deadline not yet over', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'
      const bidPrice = '0.6'

      await createAuction(tokenId, start, end, startPrice)

      // fast forward to bid start
      await fastForwardTo(start)

      // create bid
      await auction.connect(addr1).bid(tokenId, {
        from: addr1.address,
        value: ethers.utils.parseEther(bidPrice),
      })
      const [, , , , maxBid, maxBidUser, , , ,] =
        await auction.getTokenAuctionDetails(tokenId)
      expect(ethers.utils.parseEther(bidPrice)).to.equal(maxBid)
      expect(maxBidUser).to.equal(addr1.address)

      await expect(auction.acceptOffer(tokenId)).to.be.revertedWith(
        'Auction: Deadline did not pass yet'
      )
    })
  })

  describe('CancelAuction', function () {
    beforeEach(async () => {
      await nft.flipTrustedOperatorState(auction.address)
    })

    it('should be able to create auction', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'

      await createAuction(tokenId, start, end, startPrice)
    })

    it('should be able to cancel auction', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'
      const bidPrice = '0.6'

      await createAuction(tokenId, start, end, startPrice)

      // fast forward to bid start
      await fastForwardTo(start)

      // create bid simulate refund
      await auction.connect(addr1).bid(tokenId, {
        from: addr1.address,
        value: ethers.utils.parseEther(bidPrice),
      })
      expect(await nft.ownerOf(tokenId)).to.equal(auction.address) // owner must be auction

      const bidderPreBalance = await waffle.provider.getBalance(addr1.address)
      await auction.cancelAuction(tokenId)
      // return token
      expect(await nft.ownerOf(tokenId)).to.equal(owner.address)
      expect(await waffle.provider.getBalance(addr1.address)).to.gt(
        bidderPreBalance
      )
    })

    it('should not be able cancel auction if caller is not the seller', async function () {
      const blockTimestamp = await currentTime()
      const tokenId = 1
      const start = blockTimestamp + ONE_MONTH // start after 1 month
      const end = blockTimestamp + ONE_MONTH * 2 // duration 2 months
      const startPrice = '0.5'
      const bidPrice = '0.6'

      await createAuction(tokenId, start, end, startPrice)

      // fast forward to bid start
      await fastForwardTo(start)

      await expect(
        auction.connect(addr1).cancelAuction(tokenId)
      ).to.be.revertedWith('Auction: Not seller')
    })
  })
})
