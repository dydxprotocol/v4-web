import { Provider, Wallet } from "fuels"
import { getArgs } from "./utils"
import { StorkMockFactory } from "../types/StorkMockFactory"

if (require.main === module) {
    deployStorkMock(getArgs(["url", "privK"]))
}

async function deployStorkMock(taskArgs: any) {
    // eslint-disable-next-line no-console
    console.log("Deploy a stork mock")

    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    // eslint-disable-next-line no-console
    console.log(`Deploying mocked stork contract`)
    const { waitForResult: waitForResultMockStorkContract } = await StorkMockFactory.deploy(deployer)
    const { contract: mockStorkContract } = await waitForResultMockStorkContract()
    // eslint-disable-next-line no-console
    console.log(`Mocked Stork deployed to: contractId: ${mockStorkContract.id.toString()}`)

    return [mockStorkContract.id.toString()]
}
