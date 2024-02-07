/* eslint-disable no-console */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const SMARTBANNER_APP_NAME = process.env.SMARTBANNER_APP_NAME;
const SMARTBANNER_ORG_NAME = process.env.SMARTBANNER_ORG_NAME;
const SMARTBANNER_ICON_URL = process.env.SMARTBANNER_ICON_URL;
const SMARTBANNER_APPSTORE_URL = process.env.SMARTBANNER_APPSTORE_URL;
const SMARTBANNER_GOOGLEPLAY_URL = process.env.SMARTBANNER_GOOGLEPLAY_URL;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);
const htmlFilePath = path.resolve(projectRoot, '../dist/index.html');
const smartbannerFilePath = path.resolve(projectRoot, '../dist/smartbanner.html');

if (
  SMARTBANNER_APP_NAME &&
  SMARTBANNER_ORG_NAME &&
  SMARTBANNER_ICON_URL &&
  (SMARTBANNER_APPSTORE_URL || SMARTBANNER_GOOGLEPLAY_URL)
) {
  try {
    const html = await fs.readFile(htmlFilePath, 'utf-8');
    let smartbanner = await fs.readFile(smartbannerFilePath, 'utf-8');
    smartbanner = smartbanner
      .replace('SMARTBANNER_APP_NAME', SMARTBANNER_APP_NAME)
      .replace('SMARTBANNER_ORG_NAME', SMARTBANNER_ORG_NAME)
      .replace('SMARTBANNER_ICON_URL', SMARTBANNER_ICON_URL);

    /* hardcoded injection depending on whether the app is available on App Store and/or Google Play */

    if (SMARTBANNER_APPSTORE_URL) {
      smartbanner += `\n<meta name="smartbanner:button-url-apple" content="${SMARTBANNER_APPSTORE_URL}">`;
    }
    if (SMARTBANNER_GOOGLEPLAY_URL) {
      smartbanner += `\n<meta name="smartbanner:button-url-google" content="${SMARTBANNER_GOOGLEPLAY_URL}">`;
    }
    if (SMARTBANNER_APPSTORE_URL) {
      if (SMARTBANNER_GOOGLEPLAY_URL) {
        smartbanner += `\n<meta name="smartbanner:enabled-platforms" content="android,ios">`;
      } else {
        smartbanner += `\n<meta name="smartbanner:enabled-platforms" content="ios">`;
      }
    } else {
      if (SMARTBANNER_GOOGLEPLAY_URL) {
        smartbanner += `\n<meta name="smartbanner:enabled-platforms" content="android">`;
      }
    }

    const injectedHtml = html.replace('</head>', `${smartbanner}\n</head>`);

    await fs.writeFile(htmlFilePath, injectedHtml, 'utf-8');

    console.log('Smartbanner scripts successfully injected.');
  } catch (err) {
    console.error('Error injecting Smartbanner scripts:', err);
  }
}
