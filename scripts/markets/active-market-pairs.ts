export async function fetchActiveMarketPairs(apiHost: string): Promise<string[]> {
    // Active market pairs are those whose IDs have a status of 'STATUS_ACTIVE' in the CLOB_PAIR_URL.
    const marketURL = `${apiHost}/dydxprotocol/prices/params/market`;
    const clobPairURL = `${apiHost}/dydxprotocol/clob/clob_pair`;

    const allMarkets = await fetchItems(marketURL, 'market_params');
    const clobPairs = await fetchItems(clobPairURL, 'clob_pair');

    const activeMarketIds = new Set(
        clobPairs
            .filter((clobPair: { status: string }) => clobPair.status === 'STATUS_ACTIVE')
            .map((clobPair: { id: string }) => clobPair.id)
    );

    const activeMarketPairs = allMarkets
        .filter((market: { id: string }) => activeMarketIds.has(market.id))
        .map((market: { pair: string }) => market.pair);

    console.log('Original number of markets:', allMarkets.length);
    console.log('Final number of markets:', activeMarketPairs.length);

    return activeMarketPairs;
}

async function fetchItems(url: string, contentItemsKey: string): Promise<any[]> {
    const items: any[] = [];
    let key = '';

    do {
        const params = new URLSearchParams();
        params.set('pagination.key', key);

        const response = await fetch(`${url}?${params}`);
        const data = await response.json();

        items.push(...data[contentItemsKey]);
        key = data.pagination?.next_key || '';
    } while (key);

    return items;
}
