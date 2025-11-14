import { Provider, Wallet } from "fuels"
import { getArgs } from "./utils"
import { StorkMockFactory } from "../types/StorkMockFactory"

if (require.main === module) {
    deployStorkMock(getArgs(["url", "privK"])).then(() => {
        process.exit(0)
    }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error)
        process.exit(1)
    })
}

async function deployStorkMock(taskArgs: any) {
    // eslint-disable-next-line no-console
    console.log("Deploy a stork mock")

    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    // eslint-disable-next-line no-console
    console.log(`Deploying mocked stork contract`)
    const { waitForResult: waitForResultMockStorkContract } = await StorkMockFactory.deploy(deployer, { salt: "0x8000000000000000000000000000000000000000000000000000000000000000" })
    const { contract: mockStorkContract } = await waitForResultMockStorkContract()
    // eslint-disable-next-line no-console
    console.log(`Mocked Stork deployed to: contractId: ${mockStorkContract.id.toString()}`)

    return [mockStorkContract.id.toString()]
}
