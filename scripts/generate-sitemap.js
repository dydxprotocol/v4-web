import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Generating sitemap...');

const MARKET_URL = 'https://dydx-ops-rest.kingnodes.com/dydxprotocol/prices/params/market';
const CLOB_PAIR_URL = 'https://dydx-ops-rest.kingnodes.com/dydxprotocol/clob/clob_pair';

const currentPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentPath);
const sitemapConfigFilePath = path.resolve(scriptsDir, '../public/configs/sitemap.json');
const sitemapFilePath = path.resolve(scriptsDir, '../public/sitemap.xml');

await writeSitemap();


// --- Functions ---

async function writeSitemap() {
    try {
        const sitemapConfigJson = await fs.readFile(sitemapConfigFilePath, 'utf-8');
        const baseURL = JSON.parse(sitemapConfigJson)['baseURL'];
        const staticURLs = JSON.parse(sitemapConfigJson)['staticURLs'];

        const markets = await fetchActiveMarketPairs();

        const staticPart = staticURLs.map((url) => `
            <url>
                <loc>${url}</loc>
                <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>`
        ).join('');

        const marketsPart = markets.map((pairText) => `
            <url>
                <loc>${baseURL}/trade/${pairText}</loc>
                <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
                <changefreq>daily</changefreq>
                <priority>0.8</priority>
            </url>`
        ).join('');

        const siteMap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${staticPart}
            ${marketsPart}
        </urlset>
        `;

        await fs.writeFile(sitemapFilePath, siteMap, 'utf-8');

        console.log('Sitemap generated successfully.');
    } catch (err) {
        console.error('Error generating sitemap:', err);
    }
}

async function fetchActiveMarketPairs() {
    // 1. Fetch all markets
    // 2. Fetch inactive markets (CLOB pair ids that have status different than 'STAUTS_ACTIVE')
    // 3. Evaluate active markets: all markets - inactive markets

    const markets = {};

    let marketsResponse = {};
    let key = '';
    do {
        marketsResponse = await fetchResponse(MARKET_URL, key);
        key = marketsResponse["pagination"]["next_key"];
        marketsResponse['market_params'].forEach((market) => {
            markets[market['id']] = market['pair'];
        });
    } while (key);
    console.log('Original number of markets:', Object.keys(markets).length);

    let clobPairResponse = {};
    key = '';
    do {
        clobPairResponse = await fetchResponse(CLOB_PAIR_URL, key);
        key = clobPairResponse["pagination"]["next_key"];
        clobPairResponse['clob_pair'].forEach((clobPair) => {
            if (clobPair['status'] !== 'STATUS_ACTIVE') {
                delete markets[clobPair['id']];
            }
        });
    } while (key);
    console.log('Final number of markets:', Object.keys(markets).length);

    return Object.values(markets);
}

async function fetchResponse(url, key) {
    let params = new URLSearchParams();
    params.set('pagination.key', key);
    params.toString();

    const response = await fetch(`${url}?${params}`);

    return await response.json();
}
