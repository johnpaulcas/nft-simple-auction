# Simple NFT and Auction

## Install
```shell
> npm ci
```

## Run Test
```shell
// run specific test
> npx hardhat test test/Auction.test.js

OR

// run all test
> npx hardhat test
```

## Project structure
```
├── README.md
├── artifacts
|  ├── @openzeppelin
|  ├── build-info
|  └── contracts
├── cache
|  ├── console-history.txt
|  └── solidity-files-cache.json
├── contracts
|  ├── Auction.sol
|  ├── NFT.sol
|  └── mocks
├── coverage.json
├── hardhat.config.js
├── package-lock.json
├── package.json
├── scripts
|  ├── 1_deploy.js
|  ├── helpers
|  └── sample-script.js
└── test
   ├── Auction.test.js
   ├── NFT.test.js
   ├── helpers
   └── sample-test.js
```

## Deployed Contract
- NFT: 0xF8831ec3054441ca67707d548CCe386fcB2CDbae
- Auction: 0x355205cEf9C03c106DCd8f47A6A0b1C23BA962F1
