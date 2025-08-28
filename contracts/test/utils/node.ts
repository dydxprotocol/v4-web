import { launchTestNode } from 'fuels/test-utils';

export async function launchNode() {
    const launched = await launchTestNode({
        walletsConfig: {
          count: 5, // Number of wallets you want
        },
      });
      
      const {
        wallets: [deployer, user0, user1, user2, user3],
      } = launched;

      return [ deployer, user0, user1, user2, user3 ]
}
