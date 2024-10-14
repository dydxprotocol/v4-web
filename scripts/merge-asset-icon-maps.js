import { existsSync } from 'fs';
import path from 'path';

const assetIcons = {}; // Copy assetIcons from src/components/AssetIcon

const METADATA_SERVICE_RETURN = {}; // Object from metadata service /info endpoint

const PATH_TO_ASSET_PNG = 'public/currencies';

const checkFileExists = (directory, filename) => {
  const filePath = path.join(directory, filename);
  return existsSync(filePath);
};

Object.keys(METADATA_SERVICE_RETURN)
  .sort()
  .forEach((key) => {
    if (checkFileExists(PATH_TO_ASSET_PNG, `${key}.png`)) {
      assetIcons[key] = `/currencies/${key.toLowerCase()}.png`;
    }
  });

// Merged object of assetIcons and METADATA_SERVICE_RETURN assetIcons
// eslint-disable-next-line no-console
console.log(assetIcons);
