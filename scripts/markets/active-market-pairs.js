export async function fetchActiveMarketPairs(apiHost) {
    // Active market pairs are those whose IDs have a status of 'STATUS_ACTIVE' in the CLOB_PAIR_URL.
    const marketURL = `${apiHost}/dydxprotocol/prices/params/market`;
    const clobPairURL = `${apiHost}/dydxprotocol/clob/clob_pair`;

    const allMarkets = await fetchItems(marketURL, 'market_params');
    const clobPairs = await fetchItems(clobPairURL, 'clob_pair');

    const activeMarketIds = new Set(
        clobPairs
            .filter(clobPair => clobPair.status === 'STATUS_ACTIVE')
            .map(clobPair => clobPair.id)
    );

    const activeMarketPairs = allMarkets
        .filter(market => activeMarketIds.has(market.id))
        .map(market => market.pair);

    return activeMarketPairs;
}

async function fetchItems(url, contentItemsKey) {
    const items = [];
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
