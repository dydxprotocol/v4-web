import { Provider } from "fuels"
import { StorkMock } from "../types/StorkMock"
import { getArgs } from "./utils"

// Asset names and IDs
const ASSETS = {
    USDC: "0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c",
    BTC: "0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de",
    BNB: "0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4",
    ETH: "0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160",
}

async function verifyPrices(taskArgs: any) {
    // eslint-disable-next-line no-console
    console.log("=".repeat(80))
    // eslint-disable-next-line no-console
    console.log("Verifying StorkMock Contract Price Data")
    // eslint-disable-next-line no-console
    console.log("=".repeat(80))
    // eslint-disable-next-line no-console
    console.log(`Contract Address: ${taskArgs.mockPricefeedAddress}`)
    // eslint-disable-next-line no-console
    console.log(`Fuel RPC URL: ${taskArgs.url}`)
    // eslint-disable-next-line no-console
    console.log("=".repeat(80))
    // eslint-disable-next-line no-console
    console.log("")

    const provider = new Provider(taskArgs.url)
    const storkMock = new StorkMock(taskArgs.mockPricefeedAddress, provider)

    const currentTime = Date.now()

    // eslint-disable-next-line no-restricted-syntax
    for (const [assetName, assetId] of Object.entries(ASSETS)) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const result = await storkMock.functions
                .get_temporal_numeric_value_unchecked_v1(assetId)
                .get()

            const priceValue = result.value.quantized_value
            const timestampNs = result.value.timestamp_ns

            // Convert timestamp from nanoseconds to milliseconds
            const timestampMs = Number(timestampNs) / 1_000_000
            const priceDate = new Date(timestampMs)
            const ageSeconds = Math.floor((currentTime - timestampMs) / 1000)

            // Format age
            let ageDisplay: string
            if (ageSeconds < 60) {
                ageDisplay = `${ageSeconds}s ago`
            } else if (ageSeconds < 3600) {
                const minutes = Math.floor(ageSeconds / 60)
                ageDisplay = `${minutes}m ${ageSeconds % 60}s ago`
            } else {
                const hours = Math.floor(ageSeconds / 3600)
                const minutes = Math.floor((ageSeconds % 3600) / 60)
                ageDisplay = `${hours}h ${minutes}m ago`
            }

            // Determine freshness status
            let freshnessIndicator: string
            if (ageSeconds < 300) {
                // Less than 5 minutes
                freshnessIndicator = "✅ FRESH"
            } else if (ageSeconds < 600) {
                // Less than 10 minutes
                freshnessIndicator = "⚠️  SLIGHTLY STALE"
            } else {
                freshnessIndicator = "❌ STALE"
            }

            // Format price value (it's stored with 18 decimals)
            const priceStr = priceValue.toString()

            // eslint-disable-next-line no-console
            console.log(`${assetName}:`)
            // eslint-disable-next-line no-console
            console.log(`  Asset ID:       ${assetId}`)
            // eslint-disable-next-line no-console
            console.log(`  Price (raw):    ${priceStr}`)
            // eslint-disable-next-line no-console
            console.log(`  Timestamp:      ${priceDate.toISOString()}`)
            // eslint-disable-next-line no-console
            console.log(`  Age:            ${ageDisplay}`)
            // eslint-disable-next-line no-console
            console.log(`  Status:         ${freshnessIndicator}`)
            // eslint-disable-next-line no-console
            console.log("")
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log(`${assetName}:`)
            // eslint-disable-next-line no-console
            console.log(`  Asset ID:       ${assetId}`)
            // eslint-disable-next-line no-console
            console.log(`  Status:         ❌ ERROR`)
            // eslint-disable-next-line no-console
            console.log(`  Error:          ${error.message}`)
            // eslint-disable-next-line no-console
            console.log("")
        }
    }

    // eslint-disable-next-line no-console
    console.log("=".repeat(80))
    // eslint-disable-next-line no-console
    console.log("Verification Complete")
    // eslint-disable-next-line no-console
    console.log("=".repeat(80))
}

if (require.main === module) {
    verifyPrices(getArgs(["url", "mockPricefeedAddress"]))
}
