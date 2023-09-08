import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const STATUS_PAGE_SCRIPT_URI = process.env.STATUS_PAGE_SCRIPT_URI;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);
const htmlFilePath = path.resolve(projectRoot, '../dist/index.html');

if (STATUS_PAGE_SCRIPT_URI) {
  try {
    const html = await fs.readFile(htmlFilePath, 'utf-8');

    const statusPageScript = `<script defer src="${STATUS_PAGE_SCRIPT_URI}"></script>`;

    const injectedHtml = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n${statusPageScript}\n`
    );

    await fs.writeFile(htmlFilePath, injectedHtml, 'utf-8');

    console.log('StatusPage script successfully injected.');
  } catch (err) {
    console.error('Error injecting StatusPage scripts:', err);
  }
}
