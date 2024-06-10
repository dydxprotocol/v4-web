import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const HOTJAR_SITE_ID = process.env.HOTJAR_SITE_ID;
const HOTJAR_VERSION = process.env.HOTJAR_VERSION;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);

if (HOTJAR_SITE_ID && HOTJAR_VERSION) {
  try {
    const files = await fs.readdir('entry-points');
    for (const file of files) {
      inject(file);
    };
  } catch (err) {
    console.error('Error injecting Hotjar script:', err);
  }
} else {
  console.warn("Missing HOTJAR_SITE_ID or HOTJAR_VERSION, hotjar not injected");
}

async function inject(fileName) {
  const htmlFilePath = path.resolve(projectRoot, `../dist/entry-points/${fileName}`);
  const html = await fs.readFile(htmlFilePath, 'utf-8');

  const hotjarScript = `
  <script>
      (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:${HOTJAR_VERSION}};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  </script>`;

  const injectedHtml = html.replace('</head>', `${hotjarScript}\n</head>`);

  await fs.writeFile(htmlFilePath, injectedHtml, 'utf-8');

  console.log(`Hotjar script successfully injected (${fileName}).`);
}