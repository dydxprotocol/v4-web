import { Provider, Wallet } from "fuels"
import { getArgs, getRandomSalt } from "./utils"
import { StorkMockFactory } from "../types/StorkMockFactory"

if (require.main === module) {
    deployStorkMock(getArgs(["url", "privK"], ["salt"]))
        .then(() => {
            process.exit(0)
        })
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

async function deployStorkMock(taskArgs: any) {
    const salt = taskArgs.salt || getRandomSalt()
    // eslint-disable-next-line no-console
    console.log("Deploy a stork mock")

    const provider = new Provider(taskArgs.url)
    const deployer = Wallet.fromPrivateKey(taskArgs.privK, provider)

    console.log(`Deploying mocked stork contract`)
    const { waitForResult: waitForResultMockStorkContract } = await StorkMockFactory.deploy(deployer, {
        salt,
    })
    const { contract: mockStorkContract } = await waitForResultMockStorkContract()

    console.log(`Mocked Stork deployed to: contractId: ${mockStorkContract.id.toString()}`)

    return [mockStorkContract.id.toString()]
}
