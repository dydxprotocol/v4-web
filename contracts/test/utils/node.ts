import { WalletUnlocked } from 'fuels';
import { DeployContractConfig, launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';

export async function launchNode() : Promise<LaunchTestNodeReturn<DeployContractConfig[]>> {
  const launched: LaunchTestNodeReturn<DeployContractConfig[]> = await launchTestNode({
      walletsConfig: {
        count: 5, // Number of wallets you want
      },
    })

    return launched
}

export function getNodeWallets(launchedNode: LaunchTestNodeReturn<DeployContractConfig[]>) : WalletUnlocked[] {
    const {
      wallets: [deployer, user0, user1, user2, user3],
    } = launchedNode

    return [ deployer, user0, user1, user2, user3 ]
}
