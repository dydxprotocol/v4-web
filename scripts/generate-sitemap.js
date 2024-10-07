import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchActiveMarketPairs } from './markets/active-market-pairs.js';

console.log('Generating sitemap...');

const currentPath = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentPath);
const sitemapConfigFilePath = path.resolve(scriptsDir, '../public/configs/sitemap.json');
const sitemapFilePath = path.resolve(scriptsDir, '../public/sitemap.xml');

try {
    const sitemapConfigRaw = await fs.readFile(sitemapConfigFilePath, 'utf-8');
    const sitemapConfig = JSON.parse(sitemapConfigRaw);
    const baseURL = sitemapConfig['baseURL'];
    const staticURLs = sitemapConfig['staticURLs'];

    const marketPairs = await fetchActiveMarketPairs('https://dydx-ops-rest.kingnodes.com');

    const siteMap = await generateSitemap(baseURL, staticURLs, marketPairs);
    await fs.writeFile(sitemapFilePath, siteMap, 'utf-8');

    console.log('Sitemap generated successfully.');
} catch (err) {
    console.error('Error generating sitemap:', err);
}


async function generateSitemap(baseURL, staticURLs, marketPairs) {
    const staticPart = staticURLs.map((url) => `
            <url>
                <loc>${url}</loc>
                <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>`
    ).join('');

    const marketsPart = marketPairs.map((pairText) => `
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

    return siteMap;
}
