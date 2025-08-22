import { expect, use } from "chai"
import { AbstractContract, Provider, Signer, Wallet, WalletUnlocked } from "fuels"
import { Fungible, Rlp, TimeDistributor, Rusd, Utils, VaultPricefeed, YieldTracker, Vault } from "../../../types"
import { deploy, getBalance, getValue, getValStr, formatObj, call } from "../../utils/utils"
import { addrToIdentity, contrToIdentity, toAddress, toContract } from "../../utils/account"
import { asStr, expandDecimals, toNormalizedPrice, toPrice, toUsd } from "../../utils/units"
import { getAssetId, toAsset } from "../../utils/asset"
import { useChai } from "../../utils/chai"
import { BTC_MAX_LEVERAGE, getBtcConfig, getDaiConfig, validateVaultBalance } from "../../utils/vault"
import { WALLETS } from "../../utils/wallets"
import { getPosition } from "../../utils/contract"
import { BNB_PRICEFEED_ID, BTC_PRICEFEED_ID, DAI_PRICEFEED_ID, getUpdatePriceDataCall } from "../../utils/mock-pyth"

use(useChai)

describe("Vault.closeLongPosition", () => {
    let attachedContracts: AbstractContract[]
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
    let vault: Vault
    let rusd: Rusd
    let RUSD: string // the RUSD fungible asset
    let vaultPricefeed: VaultPricefeed
    let timeDistributor: TimeDistributor
    let yieldTracker: YieldTracker
    let rlp: Rlp

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

        /*
            Vault + Router + RUSD
        */
        utils = await deploy("Utils", deployer)
        vault = await deploy("Vault", deployer)
        vaultPricefeed = await deploy("VaultPricefeed", deployer)
        rusd = await deploy("Rusd", deployer)
        timeDistributor = await deploy("TimeDistributor", deployer)
        yieldTracker = await deploy("YieldTracker", deployer)
        rlp = await deploy("Rlp", deployer)
        attachedContracts = [vault, vaultPricefeed, rusd]

        RUSD = getAssetId(rusd)

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

        await call(
            vault.functions.set_funding_rate(
                8 * 3600, // funding_interval (8 hours)
                600, // fundingRateFactor
                600, // stableFundingRateFactor
            ),
        )

        await call(rlp.functions.initialize())
    })

    it("close long position", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(41000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault
                .as(user1)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))

        await expect(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(110), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq("10149750000000000000000000000000")
        expect(position.average_price).eq("41041000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2197319")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(45100), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(46100), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(47100), vaultPricefeed, priceUpdateSigner))

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9692")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(79.85025))
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2197319")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740308")
        expect(await getBalance(user2, BTC)).eq("0")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(true)
        expect(delta[1]).eq("13183669988548037328525133403182")

        await call(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(4),
                    toUsd(90),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0") // size
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0") // pnl
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("11600")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2245402")
        expect(await getBalance(user2 as any, BTC)).eq("492997")

        await validateVaultBalance(expect, vault, BTC, 1)
    })

    it("close long position with loss", async () => {
        await call(getUpdatePriceDataCall(toAsset(DAI), toPrice(1), vaultPricefeed, priceUpdateSigner))
        await call(vault.functions.set_asset_config(...getDaiConfig(DAI)))

        await call(vault.functions.set_asset_config(...getBtcConfig(BTC)))
        await call(vault.functions.set_max_leverage(toAsset(BTC), BTC_MAX_LEVERAGE))

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(40000), vaultPricefeed, priceUpdateSigner))

        await call(BTC.functions.mint(addrToIdentity(user1), expandDecimals(1)))
        await call(
            vault
                .as(user1)
                .functions.buy_rusd(toAsset(BTC), addrToIdentity(user1))
                .addContracts(attachedContracts)
                .callParams({
                    forward: [250000 * 10, getAssetId(BTC)],
                }),
        )

        await call(BTC.functions.mint(addrToIdentity(user0), expandDecimals(1)))
        await expect(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(110), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                })
                .call(),
        ).to.be.revertedWith("VaultReserveExceedsPool")

        await call(
            vault
                .connect(user0)
                .functions.increase_position(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), toUsd(90), true)
                .addContracts(attachedContracts)
                .callParams({
                    forward: [25000 * 10, getAssetId(BTC)],
                }),
        )

        let position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq(toUsd(90))
        expect(position.collateral).eq(toUsd(9.9))
        expect(position.average_price).eq("40040000000000000000000000000000000")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("2252252")

        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))
        await call(getUpdatePriceDataCall(toAsset(BTC), toPrice(39000), vaultPricefeed, priceUpdateSigner))

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("9747")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq(toUsd(80.1))
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("2252252")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2740253")
        expect(await getBalance(user2, BTC)).eq("0")

        let delta = formatObj(
            await getValue(vault.functions.get_position_delta(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true)),
        )
        expect(delta[0]).eq(false)
        expect(delta[1]).eq("2425324675324675324675324675324")

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        await call(
            vault
                .connect(user0)
                .functions.decrease_position(
                    addrToIdentity(user0),
                    toAsset(BTC),
                    toAsset(BTC),
                    toUsd(4),
                    toUsd(90),
                    true,
                    addrToIdentity(user2),
                )
                .addContracts(attachedContracts),
        )

        position = formatObj(await getPosition(addrToIdentity(user0), toAsset(BTC), toAsset(BTC), true, vault))
        expect(position.size).eq("0") // size
        expect(position.collateral).eq("0") // collateral
        expect(position.average_price).eq("0")
        expect(position.entry_funding_rate).eq("0")
        expect(position.reserve_amount).eq("0")
        expect(position.realized_pnl.value).eq("0") // pnl
        expect(position.realized_pnl.is_neg).eq(false)

        expect(await getValStr(vault.functions.get_fee_reserves(toAsset(BTC)))).eq("12052")
        expect(await getValStr(vault.functions.get_guaranteed_usd(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_reserved_amount(toAsset(BTC)))).eq("0")
        expect(await getValStr(vault.functions.get_pool_amounts(toAsset(BTC)))).eq("2548787")
        expect(await getBalance(user2, BTC)).eq("189161")

        await validateVaultBalance(expect, vault, BTC)
    })
})
