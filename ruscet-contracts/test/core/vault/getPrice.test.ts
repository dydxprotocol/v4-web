import { expect, use } from "chai"
import { Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Fungible, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getValStr, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { expandDecimals, toPrice, toUsd } from "../../utils/units"
import { toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { DAI_MAX_LEVERAGE, getDaiConfig } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import {
    BNB_PRICEFEED_ID,
    BTC_PRICEFEED_ID,
    DAI_PRICEFEED_ID,
    getUpdatePriceDataCall,
    USDC_PRICEFEED_ID,
} from "../../utils/mock-pyth"

use(useChai)

describe("Vault.getPrice", function () {
    let priceUpdateSigner: Signer
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let user3: WalletUnlocked
    let utils: Utils
    let BNB: Fungible
    let DAI: Fungible
    let BTC: Fungible
    let USDC: Fungible
    let vault: Vault
    let rusd: Rusd

    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker

    beforeEach(async () => {
        const provider = await Provider.create("http://127.0.0.1:4000/v1/graphql")

        const wallets = WALLETS.map((k) => Wallet.fromPrivateKey(k, provider))
        ;[deployer, user0, user1, user2, user3] = wallets
        priceUpdateSigner = new Signer(WALLETS[0])

        /*
            NativeAsset + Pricefeed
        */
        BNB = await deploy("Fungible", deployer)
        DAI = await deploy("Fungible", deployer)
        BTC = await deploy("Fungible", deployer)
        USDC = await deploy("Fungible", deployer)

        /*
            Vault + Router + RUSD
        */
        utils = await deploy("Utils", deployer)
        vault = await deploy("Vault", deployer)
        vaultPricefeed = await deploy("VaultPricefeed", deployer)
        rusd = await deploy("Rusd", deployer)
        timeDistributor = await deploy("TimeDistributor", deployer)
        yieldTracker = await deploy("YieldTracker", deployer)

        await call(rusd.functions.initialize(toContract(vault), toAddress(user0)))

        await call(vault.functions.initialize(addrToIdentity(deployer), toAsset(rusd), toContract(rusd)))
        await call(vault.functions.set_pricefeed_provider(toContract(vaultPricefeed)))

        await call(yieldTracker.functions.initialize(toContract(rusd)))
        await call(yieldTracker.functions.set_time_distributor(toContract(timeDistributor)))
        await call(timeDistributor.functions.initialize())
        await call(timeDistributor.functions.set_distribution([contrToIdentity(yieldTracker)], [1000], [toAsset(BNB)]))

        await call(BNB.functions.mint(contrToIdentity(timeDistributor), 5000))
        await call(rusd.functions.set_yield_trackers([{ bits: contrToIdentity(yieldTracker).ContractId?.bits as string }]))

        await call(vaultPricefeed.functions.initialize(addrToIdentity(deployer), toAddress(deployer)))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BNB), BNB_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(DAI), DAI_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(BTC), BTC_PRICEFEED_ID, 9))
        await call(vaultPricefeed.functions.set_asset_config(toAsset(USDC), USDC_PRICEFEED_ID, 9))

        await call(
            vault.functions.set_funding_rate(
                8 * 3600, // funding_interval (8 hours)
                600, // fundingRateFactor
                600, // stableFundingRateFactor
            ),
        )
    })

    it("get_price", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(DAI), true))).eq("1001000000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1.1), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(DAI), true))).eq("1101100000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(
            vault.functions.set_asset_config(
                toAsset(USDC), // _token
                8, // _tokenDecimals
                10000, // _tokenWeight
                75, // _minProfitBps,
                0, // _maxRusdAmount
                false, // _isStable
                true, // _isShortable
            ),
        )

        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("1001000000000000000000000000000")
        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(1.1), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("1101100000000000000000000000000")

        // await call(vaultPricefeed.functions.set_max_strict_price_deviation(expandDecimals(1, 29)))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("1101100000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(1.11), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("1111110000000000000000000000000")
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), false))).eq("1108890000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(0.9), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("900900000000000000000000000000")
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), false))).eq("899100000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(USDC), toPrice(0.89), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), true))).eq("890890000000000000000000000000")
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(USDC), false))).eq("889110000000000000000000000000")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))
        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(BTC), true))).eq("40040000000000000000000000000000000")

        expect(await getValStr(vaultPricefeed.functions.get_price(toAsset(BTC), false))).eq("39960000000000000000000000000000000")
    })
})
