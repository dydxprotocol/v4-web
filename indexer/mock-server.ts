import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';

// Read the clean schema file
const typeDefs = readFileSync('./schema-clean.graphql', 'utf8');

// Mock data generators
const generateMockAddress = (id: string) => ({
    id,
    address: `0x${id.padStart(40, '0')}`,
    metadata: { name: `Address ${id}` }
});

const generateMockMarket = (id: string, ticker: string) => ({
    id,
    ticker,
    atomicResolution: -9,
    baseOpenInterest: '1000000000000',
    defaultFundingRate1H: '0.0001',
    initialMarginFraction: '0.05',
    maintenanceMarginFraction: '0.025',
    marketType: 'PERP',
    nextFundingRate: '0.0001',
    openInterest: '500000000000',
    openInterestLowerCap: '100000000000',
    openInterestUpperCap: '10000000000000',
    oraclePrice: { price: '2000.00', timestamp: BigInt(Date.now()) },
    priceChange24H: '0.05',
    quantumConversionExponent: -6,
    status: 'Active',
    stepBaseQuantums: BigInt('1000000000'),
    stepSize: '0.001',
    subticksPerTick: 100000,
    tickSize: '0.01',
    trades24H: BigInt(1500),
    volume24H: BigInt('5000000000000')
});

const generateMockAccount = (id: string, addressId: string) => ({
    id,
    address: addressId,
    subaccountNumber: 0,
    subaccountId: id,
    isLiquidator: false,
    isHandler: false,
    isManager: false,
    metadata: { name: `Account ${id}` },
    owner: generateMockAddress(addressId)
});

const generateMockPosition = (id: string, accountId: string, marketId: string, side: 'LONG' | 'SHORT' = 'LONG') => ({
    id,
    status: 'OPEN',
    side,
    size: BigInt('1000000000'),
    maxSize: BigInt('1000000000'),
    entryPrice: '2000.00',
    exitPrice: '0',
    realizedPnl: '0',
    createdAt: new Date().toISOString(),
    createdAtHeight: 1000000,
    sumOpen: '1000000000',
    sumClose: '0',
    netFunding: '0',
    unrealizedPnl: '0',
    closedAt: null,
    subaccountNumber: 0,
    ticker: 'ETH-USD',
    collateral: '100.00',
    positionFees: '0.50',
    entryFundingRate: '0.0001',
    reserveAmount: '0',
    lastIncreasedTime: new Date().toISOString(),
    account: { id: accountId },
    market: { id: marketId }
});

const generateMockTrade = (id: string, marketId: string, positionId: string) => ({
    id,
    created_at_height: 1000000,
    created_at: new Date().toISOString(),
    side: 'BUY',
    price: '2000.00',
    size: BigInt('1000000000'),
    trade_type: 'Limit',
    market: { id: marketId },
    position: { id: positionId }
});

const generateMockPayment = (id: string, marketId: string, positionId: string) => ({
    id,
    createdAt: BigInt(Date.now()),
    createdAtHeight: 1000000,
    ticker: 'ETH-USD',
    oraclePrice: '2000.00',
    size: '1000000000',
    side: 'LONG',
    rate: '0.0001',
    payment: '0.20',
    subaccountNumber: 0,
    fundingIndex: '1',
    type: 'FUNDING',
    position: { id: positionId },
    market: { id: marketId }
});

const generateMockCandle = (id: string, marketId: string, resolution: string, timestamp: number) => ({
    id,
    ticker: 'ETH-USD',
    resolution,
    startedAt: BigInt(timestamp),
    open: '2000.00',
    close: '2010.00',
    high: '2020.00',
    low: '1990.00',
    baseTokenVolume: '1000000000',
    usdVolume: '2000000000000',
    startingOpenInterest: '500000000000',
    market: { id: marketId }
});

// Generate mock data
const mockAddresses = Array.from({ length: 10 }, (_, i) => generateMockAddress((i + 1).toString()));
const mockMarkets = [
    generateMockMarket('1', 'ETH-USD'),
    generateMockMarket('2', 'BTC-USD'),
    generateMockMarket('3', 'SOL-USD')
];
const mockAccounts = Array.from({ length: 5 }, (_, i) => generateMockAccount((i + 1).toString(), (i + 1).toString()));
const mockPositions = Array.from({ length: 20 }, (_, i) =>
    generateMockPosition(
        `pos-${i + 1}`,
        mockAccounts[i % mockAccounts.length].id,
        mockMarkets[i % mockMarkets.length].id,
        i % 2 === 0 ? 'LONG' : 'SHORT'
    )
);
const mockTrades = Array.from({ length: 50 }, (_, i) =>
    generateMockTrade(
        `trade-${i + 1}`,
        mockMarkets[i % mockMarkets.length].id,
        mockPositions[i % mockPositions.length].id
    )
);
const mockPayments = Array.from({ length: 30 }, (_, i) =>
    generateMockPayment(
        `payment-${i + 1}`,
        mockMarkets[i % mockMarkets.length].id,
        mockPositions[i % mockPositions.length].id
    )
);

// Generate candles for different timeframes
const now = Date.now();
const mockCandles = [];
mockMarkets.forEach((market, marketIndex) => {
    ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].forEach((resolution, resIndex) => {
        for (let i = 0; i < 100; i++) {
            const timestamp = now - (i * getResolutionMs(resolution));
            mockCandles.push(generateMockCandle(
                `${market.id}-${resolution}-${i}`,
                market.id,
                resolution,
                timestamp
            ));
        }
    });
});

function getResolutionMs(resolution: string): number {
    const msMap: Record<string, number> = {
        'M1': 60 * 1000,
        'M5': 5 * 60 * 1000,
        'M15': 15 * 60 * 1000,
        'M30': 30 * 60 * 1000,
        'H1': 60 * 60 * 1000,
        'H4': 4 * 60 * 60 * 1000,
        'D1': 24 * 60 * 60 * 1000
    };
    return msMap[resolution] || 60 * 1000;
}

// Helper function for pagination
function paginateResults<T>(results: T[], first?: number, after?: string): T[] {
    if (!first) return results;

    let startIndex = 0;
    if (after) {
        const afterIndex = results.findIndex(item => (item as any).id === after);
        startIndex = afterIndex + 1;
    }

    return results.slice(startIndex, startIndex + first);
}

// Resolvers
const resolvers = {
    Query: {
        // Address queries
        addresses: (parent: any, args: { first?: number; after?: string }) => {
            return paginateResults(mockAddresses, args.first, args.after);
        },
        address: (parent: any, args: { id: string }) => {
            return mockAddresses.find(addr => addr.id === args.id);
        },

        // Market queries
        markets: (parent: any, args: { first?: number; after?: string; ticker?: string }) => {
            let results = mockMarkets;
            if (args.ticker) {
                results = results.filter(market => market.ticker === args.ticker);
            }
            return paginateResults(results, args.first, args.after);
        },
        market: (parent: any, args: { id: string }) => {
            return mockMarkets.find(market => market.id === args.id);
        },

        // Account queries
        accounts: (parent: any, args: { first?: number; after?: string; address?: string }) => {
            let results = mockAccounts;
            if (args.address) {
                results = results.filter(account => account.address === args.address);
            }
            return paginateResults(results, args.first, args.after);
        },
        account: (parent: any, args: { id: string }) => {
            return mockAccounts.find(account => account.id === args.id);
        },

        // Position queries
        positions: (parent: any, args: {
            first?: number;
            after?: string;
            status?: string;
            account?: string;
            market?: string;
            side?: string;
        }) => {
            let results = mockPositions;

            if (args.status) {
                results = results.filter(pos => pos.status === args.status);
            }
            if (args.account) {
                results = results.filter(pos => pos.account.id === args.account);
            }
            if (args.market) {
                results = results.filter(pos => pos.market.id === args.market);
            }
            if (args.side) {
                results = results.filter(pos => pos.side === args.side);
            }

            return paginateResults(results, args.first, args.after);
        },
        position: (parent: any, args: { id: string }) => {
            return mockPositions.find(pos => pos.id === args.id);
        },

        // Trade queries
        trades: (parent: any, args: {
            first?: number;
            after?: string;
            market?: string;
            side?: string;
        }) => {
            let results = mockTrades;

            if (args.market) {
                results = results.filter(trade => trade.market.id === args.market);
            }
            if (args.side) {
                results = results.filter(trade => trade.side === args.side);
            }

            return paginateResults(results, args.first, args.after);
        },
        trade: (parent: any, args: { id: string }) => {
            return mockTrades.find(trade => trade.id === args.id);
        },

        // Payment queries
        payments: (parent: any, args: {
            first?: number;
            after?: string;
            market?: string;
            type?: string;
            side?: string;
        }) => {
            let results = mockPayments;

            if (args.market) {
                results = results.filter(payment => payment.market.id === args.market);
            }
            if (args.type) {
                results = results.filter(payment => payment.type === args.type);
            }
            if (args.side) {
                results = results.filter(payment => payment.side === args.side);
            }

            return paginateResults(results, args.first, args.after);
        },
        payment: (parent: any, args: { id: string }) => {
            return mockPayments.find(payment => payment.id === args.id);
        },

        // Candle queries
        candles: (parent: any, args: {
            first?: number;
            after?: string;
            market?: string;
            resolution?: string;
            from?: bigint;
            to?: bigint;
        }) => {
            let results = mockCandles;

            if (args.market) {
                results = results.filter(candle => candle.market.id === args.market);
            }
            if (args.resolution) {
                results = results.filter(candle => candle.resolution === args.resolution);
            }
            if (args.from) {
                results = results.filter(candle => candle.startedAt >= args.from!);
            }
            if (args.to) {
                results = results.filter(candle => candle.startedAt <= args.to!);
            }

            // Sort by timestamp descending (newest first)
            results.sort((a, b) => Number(b.startedAt - a.startedAt));

            return paginateResults(results, args.first, args.after);
        },
        candle: (parent: any, args: { id: string }) => {
            return mockCandles.find(candle => candle.id === args.id);
        },

        // Asset queries
        assets: (parent: any, args: { first?: number; after?: string }) => {
            return [];
        },
        asset: (parent: any, args: { id: string }) => {
            return null;
        }
    },

    // Entity resolvers for relationships
    Account: {
        positions: (parent: any, args: { first?: number; after?: string; status?: string }) => {
            let results = mockPositions.filter(pos => pos.account.id === parent.id);

            if (args.status) {
                results = results.filter(pos => pos.status === args.status);
            }

            return paginateResults(results, args.first, args.after);
        }
    },

    Market: {
        positions: (parent: any, args: { first?: number; after?: string; status?: string }) => {
            let results = mockPositions.filter(pos => pos.market.id === parent.id);

            if (args.status) {
                results = results.filter(pos => pos.status === args.status);
            }

            return paginateResults(results, args.first, args.after);
        },
        trades: (parent: any, args: { first?: number; after?: string }) => {
            const results = mockTrades.filter(trade => trade.market.id === parent.id);
            return paginateResults(results, args.first, args.after);
        },
        candles: (parent: any, args: { first?: number; after?: string; resolution?: string }) => {
            let results = mockCandles.filter(candle => candle.market.id === parent.id);

            if (args.resolution) {
                results = results.filter(candle => candle.resolution === args.resolution);
            }

            return paginateResults(results, args.first, args.after);
        },
        payments: (parent: any, args: { first?: number; after?: string; type?: string }) => {
            let results = mockPayments.filter(payment => payment.market.id === parent.id);

            if (args.type) {
                results = results.filter(payment => payment.type === args.type);
            }

            return paginateResults(results, args.first, args.after);
        }
    },

    Position: {
        account: (parent: any) => {
            return mockAccounts.find(acc => acc.id === parent.account.id);
        },
        market: (parent: any) => {
            return mockMarkets.find(market => market.id === parent.market.id);
        }
    },

    Trade: {
        market: (parent: any) => {
            return mockMarkets.find(market => market.id === parent.market.id);
        },
        position: (parent: any) => {
            return mockPositions.find(pos => pos.id === parent.position.id);
        }
    },

    Payment: {
        position: (parent: any) => {
            return mockPositions.find(pos => pos.id === parent.position.id);
        },
        market: (parent: any) => {
            return mockMarkets.find(market => market.id === parent.market.id);
        }
    },

    Candle: {
        market: (parent: any) => {
            return mockMarkets.find(market => market.id === parent.market.id);
        }
    },

    // Custom scalar resolvers
    BigInt: {
        __serialize: (value: any) => value.toString(),
        __parseValue: (value: any) => BigInt(value),
        __parseLiteral: (ast: any) => BigInt(ast.value)
    },
    BigDecimal: {
        __serialize: (value: any) => value.toString(),
        __parseValue: (value: any) => value,
        __parseLiteral: (ast: any) => ast.value
    },
    DateTime: {
        __serialize: (value: any) => value,
        __parseValue: (value: any) => new Date(value),
        __parseLiteral: (ast: any) => new Date(ast.value)
    },
    JSON: {
        __serialize: (value: any) => value,
        __parseValue: (value: any) => value,
        __parseLiteral: (ast: any) => ast.value
    }
};

// Create and start the server
async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    const { url } = await startStandaloneServer(server, {
        listen: { port: 4000 }
    });

    console.log(`🚀 Mock server ready at ${url}`);
    console.log(`📊 Mock data includes:`);
    console.log(`   - ${mockAddresses.length} addresses`);
    console.log(`   - ${mockMarkets.length} markets`);
    console.log(`   - ${mockAccounts.length} accounts`);
    console.log(`   - ${mockPositions.length} positions`);
    console.log(`   - ${mockTrades.length} trades`);
    console.log(`   - ${mockPayments.length} payments`);
    console.log(`   - ${mockCandles.length} candles`);
}

startServer().catch(console.error);
