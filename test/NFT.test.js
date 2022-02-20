const { expect } = require('chai')
const { ethers } = require('hardhat')

const {
  BN, // Big Number support
  constants, // Common constants, like the zero address and largest integers
  expectEvent, // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers')

const NAME = 'NFT Test'
const SYMBOL = 'TEST'

describe('ERC721', () => {
  beforeEach(async () => {
    ;[this.owner, this.addr1, this.other] = await ethers.getSigners()
    const NFT = await ethers.getContractFactory('NFT')
    this.nft = await NFT.deploy(NAME, SYMBOL)
    await this.nft.deployed()
  })

  it('should have the right name', async () => {
    expect(await this.nft.name()).to.equal(NAME)
  })

  it('should have the right symbol', async () => {
    expect(await this.nft.symbol()).to.equal(SYMBOL)
  })

  it('should be able to mint token', async () => {
    await this.nft.mintTo(this.addr1.address)
    expect(await this.nft.balanceOf(this.addr1.address)).to.equal(1)
  })

  it('should be able to set URI', async () => {
    await this.nft.setBaseURI('https://')
    expect(await this.nft.baseURI()).to.equal('https://')
  })

  it('should be able to flip operator status', async () => {
    await this.nft.flipTrustedOperatorState(this.addr1.address)
    expect(await this.nft.trustedOperators(this.addr1.address)).to.equal(true)
    await this.nft.flipTrustedOperatorState(this.addr1.address)
    expect(await this.nft.trustedOperators(this.addr1.address)).to.equal(false)
  })
})
