import { StargateClient } from '@cosmjs/stargate';
import { formatUnits } from 'viem';

const USDC_DENOM = 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5';
const RPC_URL = 'https://dydx-dao-rpc.polkachu.com';

class Client {
  async initializeClient() {
    this.stargateClient = await StargateClient.connect(RPC_URL);
  }

  async getBalances(addresses) {
    if (this.stargateClient == null) {
      throw new Error('Client not initialized');
    }

    const balances = await Promise.all(
      addresses.map(async (address) => {
        const balance = await this.stargateClient.getBalance(address, USDC_DENOM);
        return {
          address,
          balance: formatUnits(BigInt(balance.amount), 6),
        };
      })
    );

    return balances;
  }
}

const client = new Client();

async function main() {
  await client.initializeClient();
  const balanceResults = await client.getBalances([
    'dydx1y5q487qurnaz5xd2nj9q2mdvhgmr330a9ft56c',
    'dydx1j5f6css937utrlmdkh3hh86elkt7x0nk2r8fyr',
    'dydx1plu6gd6upquke2dev5f22zrzdyw0h8g7davsly',
    'dydx1kslagzp3jacswntvzwnqtsf0a4st9cm4y3f2cy',
    'dydx1jupy8skkud8lathp6qzjx80d3kv5pkc33sy3vz',
    'dydx1qamg9f4cywcprnfk98c5vr5nkkd46d2838m0jn',
    'dydx18cznrdqqdz65mysv43qum0nz33v5ewq4003jzh',
    'dydx16gz3wxu62usap9k7eyd74hxgj2n7x4vxmtwzds',
  ]);

  balanceResults.forEach((result) => {
    console.log(`${result.address}: ${result.balance}`);
  });
}

main();
