import "@nomiclabs/hardhat-ethers"
import "dotenv/config"

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
