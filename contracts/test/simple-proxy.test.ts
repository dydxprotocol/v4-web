import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { WalletUnlocked } from "fuels"
import { launchNode, getNodeWallets } from "./node"
import { call, walletToAddressIdentity, AddressIdentity } from "./utils"
import { DeployContractConfig, LaunchTestNodeReturn } from "fuels/test-utils"
import { SimpleProxyFactory, SimpleProxy, TestTargetContractFactory, TestTargetContract } from "../types"

describe("SimpleProxy", () => {
    let launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>
    let deployer: WalletUnlocked
    let user0: WalletUnlocked
    let user1: WalletUnlocked
    let user2: WalletUnlocked
    let user0Identity: AddressIdentity
    let user1Identity: AddressIdentity
    let user2Identity: AddressIdentity
    let simpleProxy: SimpleProxy

    beforeEach(async () => {
        launchedNode = await launchNode()
        ;[deployer, user0, user1, user2] = getNodeWallets(launchedNode)

        user0Identity = walletToAddressIdentity(user0)
        user1Identity = walletToAddressIdentity(user1)
        user2Identity = walletToAddressIdentity(user2)

        // Deploy SimpleProxy contract with deployer address as configurable
        const { waitForResult: waitForResultSimpleProxy } = await SimpleProxyFactory.deploy(deployer, {
            configurableConstants: {
                DEPLOYER: { bits: deployer.address.toHexString() },
            },
        })
        const { contract: simpleProxyDeployed } = await waitForResultSimpleProxy()
        simpleProxy = simpleProxyDeployed
    })

    // Helper function to deploy a test target contract with a version
    async function deployTestTargetContract(version: number): Promise<TestTargetContract> {
        const { waitForResult: waitForResultTestTarget } = await TestTargetContractFactory.deploy(deployer, {
            configurableConstants: {
                VERSION: version,
            },
        })
        const { contract: testTargetDeployed } = await waitForResultTestTarget()
        return testTargetDeployed
    }

    describe("success cases", () => {
        it("can initialize proxy", async () => {
            const version = 1
            const testTargetContractImpl = await deployTestTargetContract(version)

            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl.id.toHexString(),
                }),
            )

            // Create a TestTargetContract instance using the proxy's contract ID to call through the proxy
            // The caller is user1, not the deployer
            const testTargetContract = new TestTargetContract(simpleProxy.id.toAddress(), user1)

            // Call version() through the proxy
            const { waitForResult } = await testTargetContract.functions.version().addContracts([testTargetContractImpl]).call()
            const receivedVersion = (await waitForResult()).value
            expect(receivedVersion.toNumber()).toBe(version)

            // Verify target is set
            const receivedTarget = (await simpleProxy.functions.proxy_target().get()).value
            expect(receivedTarget?.bits).toBe(testTargetContractImpl.id.toHexString())

            // Verify owner is set
            const receivedProxyOwner = (await simpleProxy.functions.proxy_owner().get()).value
            expect(receivedProxyOwner.Initialized?.Address?.bits).toBe(user0.address.toHexString())
        })

        it("can set proxy owner", async () => {
            const version = 1
            const testTargetContractImpl = await deployTestTargetContract(version)

            // Initialize proxy with user0 as owner
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl.id.toHexString(),
                }),
            )

            // Verify initial owner
            const initialOwner = (await simpleProxy.functions.proxy_owner().get()).value
            expect(initialOwner.Initialized?.Address?.bits).toBe(user0.address.toHexString())

            // Transfer ownership to user1
            const simpleProxyUser0 = new SimpleProxy(simpleProxy.id.toAddress(), user0)
            await call(simpleProxyUser0.functions.set_proxy_owner(user1Identity))

            // Verify ownership transfer
            const updatedOwner = (await simpleProxy.functions.proxy_owner().get()).value
            expect(updatedOwner.Initialized?.Address?.bits).toBe(user1.address.toHexString())
        })

        it("can set proxy target to different contract", async () => {
            const version1 = 1
            const version2 = 2
            const testTargetContractImpl1 = await deployTestTargetContract(version1)
            const testTargetContractImpl2 = await deployTestTargetContract(version2)

            // Initialize proxy
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl1.id.toHexString(),
                }),
            )

            // Create a TestTargetContract instance using the proxy's contract ID
            const testTargetContract = new TestTargetContract(simpleProxy.id.toAddress(), user1)

            // Verify initial version through the proxy
            const { waitForResult: waitForResult1 } = await testTargetContract.functions
                .version()
                .addContracts([testTargetContractImpl1])
                .call()
            let receivedVersion = (await waitForResult1()).value
            expect(receivedVersion.toNumber()).toBe(version1)

            // Verify initial target
            let receivedTarget = (await simpleProxy.functions.proxy_target().get()).value
            expect(receivedTarget?.bits).toBe(testTargetContractImpl1.id.toHexString())

            // Set new target
            const simpleProxyUser0 = new SimpleProxy(simpleProxy.id.toAddress(), user0)
            await call(
                simpleProxyUser0.functions.set_proxy_target({
                    bits: testTargetContractImpl2.id.toHexString(),
                }),
            )

            // Verify new version through the proxy
            const { waitForResult: waitForResult2 } = await testTargetContract.functions
                .version()
                .addContracts([testTargetContractImpl2])
                .call()
            receivedVersion = (await waitForResult2()).value
            expect(receivedVersion.toNumber()).toBe(version2)

            // Verify new target
            receivedTarget = (await simpleProxy.functions.proxy_target().get()).value
            expect(receivedTarget?.bits).toBe(testTargetContractImpl2.id.toHexString())

            // Verify owner is unchanged
            const receivedProxyOwner = (await simpleProxy.functions.proxy_owner().get()).value
            expect(receivedProxyOwner.Initialized?.Address?.bits).toBe(user0.address.toHexString())
        })
    })

    describe("revert cases", () => {
        it("cannot initialize proxy by non-deployer", async () => {
            const version = 1
            const testTargetContractImpl = await deployTestTargetContract(version)

            // Non-deployer should not be able to initialize the proxy
            const simpleProxyUser0 = new SimpleProxy(simpleProxy.id.toAddress(), user0)
            await expect(
                call(
                    simpleProxyUser0.functions.initialize_proxy(user0Identity, {
                        bits: testTargetContractImpl.id.toHexString(),
                    }),
                ),
            ).rejects.toThrowError()
        })

        it("cannot initialize proxy twice", async () => {
            const version1 = 1
            const version2 = 2
            const testTargetContractImpl1 = await deployTestTargetContract(version1)
            const testTargetContractImpl2 = await deployTestTargetContract(version2)

            // First initialization should succeed
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl1.id.toHexString(),
                }),
            )

            // Second initialization should fail
            await expect(
                call(
                    simpleProxy.functions.initialize_proxy(user0Identity, {
                        bits: testTargetContractImpl2.id.toHexString(),
                    }),
                ),
            ).rejects.toThrowError()
        })

        it("cannot set proxy owner by non-owner (deployer)", async () => {
            const version = 1
            const testTargetContractImpl = await deployTestTargetContract(version)

            // Initialize proxy with user0 as owner
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl.id.toHexString(),
                }),
            )

            // Deployer should not be able to transfer ownership
            await expect(call(simpleProxy.functions.set_proxy_owner(user1Identity))).rejects.toThrowError()
        })

        it("cannot set proxy owner by other user", async () => {
            const version = 1
            const testTargetContractImpl = await deployTestTargetContract(version)

            // Initialize proxy with user0 as owner
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl.id.toHexString(),
                }),
            )

            // Other user should not be able to transfer ownership
            const simpleProxyUser1 = new SimpleProxy(simpleProxy.id.toAddress(), user1)
            await expect(call(simpleProxyUser1.functions.set_proxy_owner(user2Identity))).rejects.toThrowError()
        })

        it("cannot set proxy target by other user", async () => {
            const version1 = 1
            const version2 = 2
            const testTargetContractImpl1 = await deployTestTargetContract(version1)
            const testTargetContractImpl2 = await deployTestTargetContract(version2)

            // Initialize proxy with user0 as owner
            await call(
                simpleProxy.functions.initialize_proxy(user0Identity, {
                    bits: testTargetContractImpl1.id.toHexString(),
                }),
            )

            // Other user should not be able to set proxy target
            const simpleProxyUser1 = new SimpleProxy(simpleProxy.id.toAddress(), user1)
            await expect(
                call(
                    simpleProxyUser1.functions.set_proxy_target({
                        bits: testTargetContractImpl2.id.toHexString(),
                    }),
                ),
            ).rejects.toThrowError()
        })
    })

    afterEach(async () => {
        launchedNode.cleanup()
    })
})
