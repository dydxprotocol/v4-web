import "@nomiclabs/hardhat-ethers"
import "dotenv/config"

import "./tasks/deploy-testnet-token";
import "./tasks/faucet";
import "./tasks/run-node";
import "./tasks/deploy-starboard";
import "./tasks/setup-testnet";
import "./tasks/prices-feed";

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            allowUnlimitedContractSize: true,
            timeout: 1800000,
        },
    },
    mocha: {
        timeout: 50000,
    },
}
