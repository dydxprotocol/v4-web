import { expect, use } from "chai"
import { Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Utils } from "../../../types"
import { deploy } from "../../utils/utils"
import { useChai } from "../../utils/chai"
import { WALLETS } from "../../utils/wallets"

use(useChai)

function convertTai64ToUnixTimestamp(tai64_time: string) {
    return (BigInt(tai64_time) - BigInt(Math.pow(2, 62)) - BigInt(10)).toString()
}

describe("Utils", () => {
    let priceUpdateSigner: Signer
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let user3: WalletUnlocked
    let utils: Utils

    beforeEach(async () => {
        const provider = await Provider.create("http://127.0.0.1:4000/v1/graphql")

        const wallets = WALLETS.map((k) => Wallet.fromPrivateKey(k, provider))
        ;[deployer, user0, user1, user2, user3] = wallets
        priceUpdateSigner = new Signer(WALLETS[0])

        utils = await deploy("Utils", deployer)
    })

    it("unix_timestamp", async () => {
        const timestamps = (await utils.functions.get_unix_and_tai64_timestamp().get()).value
        const tai64_time = timestamps[0].toString()
        const unix_time = timestamps[1].toString()
        // console.log({ tai64_time, unix_time })

        const unix_date = new Date(17235185170000 /*Number(unix_time) * 1000*/)
        // console.log("Date:", unix_date)

        expect(unix_time).to.equal(convertTai64ToUnixTimestamp(tai64_time))
    })
})
