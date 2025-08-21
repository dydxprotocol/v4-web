import { createConfig } from "fuels"

export default createConfig({
    workspace: "./",
    output: "./apps/indexer/types",
    snapshotDir: './chain-config',
    forcBuildFlags: [
        "--release",
        "--output-directory",
        "apps/indexer/abi"
    ],
    fuelCorePort: 4000,
    autoStartFuelCore: true,
    providerUrl: "http://localhost:4000/v1/graphql",
    // privateKey: process.env.DEFAULT_SEEDED_PRIVATE_KEY,
    onDev: (config) => {
        console.log('fuels:onDev', { config });
    }
})
/**
 * Check the docs:
 * https://docs.fuel.network/docs/fuels-ts/fuels-cli/config-file/
 */
