/* eslint-disable no-console */
import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const PATH_TO_MARKETS_JSON = 'public/configs/markets.json';
const PATH_TO_ASSET_PNG = 'public/currencies';

const markets = JSON.parse(readFileSync(PATH_TO_MARKETS_JSON, 'utf8'));

const getBaseAsset = (market) => {
  return market.split('-')[0];
};

const checkFileExists = (directory, filename) => {
  const filePath = path.join(directory, filename);
  return existsSync(filePath);
};

const found = [];
const notFound = [];

Object.keys(markets).forEach((market) => {
  if (!checkFileExists(PATH_TO_ASSET_PNG, `${getBaseAsset(market)}.png`)) {
    notFound.push(`${chalk.red(`${getBaseAsset(market)}.png`)}`);
  } else {
    found.push(`${chalk.green(`${getBaseAsset(market)}.png`)}`);
  }
});

console.log('Assets do not exist for:\n', notFound.join('\n'));
console.log('\n');
console.log('Assets found for:\n', found.join('\n'));
