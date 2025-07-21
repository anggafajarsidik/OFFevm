// StablecoinContracts.js
const STABLECOIN_CONTRACTS = [
  // USDC
  { chainId: 42161, symbol: "USDC", decimals: 6, address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" }, // Arbitrum
  { chainId: 8453, symbol: "USDC", decimals: 6, address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },   // Base
  { chainId: 1, symbol: "USDC", decimals: 6, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },      // Ethereum
  { chainId: 59144, symbol: "USDC", decimals: 6, address: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" }, // Linea
  { chainId: 10, symbol: "USDC", decimals: 6, address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" },     // Optimism
  { chainId: 137, symbol: "USDC", decimals: 6, address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },    // Polygon PoS
  { chainId: 324, symbol: "USDC", decimals: 6, address: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4" },    // zkSync Era

  // USDT
  { chainId: 10, symbol: "USDT", decimals: 6, address: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58" },     // Optimism
  { chainId: 534352, symbol: "USDT", decimals: 6, address: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df" }, // Scroll
  { chainId: 1, symbol: "USDT", decimals: 6, address: "0xdac17f958d2ee523a2206206994597c13d831ec7" },      // Ethereum
  { chainId: 59144, symbol: "USDT", decimals: 6, address: "0xa219439258ca9da29e9cc4ce5596924745e12b93" }, // Linea
  { chainId: 42161, symbol: "USDT", decimals: 6, address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },   // Arbitrum One
  { chainId: 56, symbol: "USDT", decimals: 18, address: "0x55d398326f99059ff775485246999027b3197955" },     // BNB Smart Chain
  { chainId: 324, symbol: "USDT", decimals: 6, address: "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C" },    // zkSync Era
  { chainId: 137, symbol: "USDT", decimals: 6, address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f" }      // Polygon
];

export { STABLECOIN_CONTRACTS };
