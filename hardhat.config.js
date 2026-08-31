require("@nomicfoundation/hardhat-toolbox");

/**
 * BEEPERS Scanner
 * Robinhood Chain configuration
 *
 * RPC is provided dynamically by the deploy script,
 * so no private key is stored in this config.
 */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
