// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const sleep = require('./helpers/sleep.js')

// const OPENSEA_PROXY_RINKEBY = "0xf57b2c51ded3a29e6891aba85459d600256cf317";
// const OPENSEA_PROXY_MAINNET = "0xa5409ec958c83c3f309868babaca7c86dcb077c1";

require('dotenv').config()

async function main() {
  console.log('👷 Deploying NFT...')

  const NFT = await hre.ethers.getContractFactory('NFT')
  const nft = await NFT.deploy('Sample NFT', 'SN')

  await nft.deployed()

  console.log('NFT deployed to:', nft.address)

  console.log('👷 Deploying NFT...')
  const AUCTION = await hre.ethers.getContractFactory('Auction')
  const auction = await AUCTION.deploy(nft.address)

  await auction.deployed()

  console.log('Auction deployed to:', auction.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
