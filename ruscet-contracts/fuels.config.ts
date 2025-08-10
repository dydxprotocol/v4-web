import { createConfig } from "fuels"

export default createConfig({
    workspace: ".",
    output: "./types",
    forcBuildFlags: ["--release", "--log-level", "4"],
})

/**
 * Check the docs:
 * https://docs.fuel.network/docs/fuels-ts/fuels-cli/config-file/
 */
