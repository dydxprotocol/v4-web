import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());

const SOURCE = path.join(ROOT, 'src', 'styles', 'tradingview', 'custom-styles.css');
const DEST = path.join(ROOT, 'public', 'tradingview', 'custom-styles.css');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`[sync-tradingview-styles] Source not found: ${SOURCE}`);
    process.exit(1);
  }

  ensureDir(DEST);
  fs.copyFileSync(SOURCE, DEST);
  console.log(`[sync-tradingview-styles] Synced ${path.relative(ROOT, SOURCE)} -> ${path.relative(ROOT, DEST)}`);
}

main();


