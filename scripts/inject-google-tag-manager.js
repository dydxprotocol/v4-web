import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const GOOGLE_TAG_MANAGER_CONTAINER_ID = process.env.GOOGLE_TAG_MANAGER_CONTAINER_ID;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);

if (GOOGLE_TAG_MANAGER_CONTAINER_ID) {
  try {
    const files = await fs.readdir('entry-points');
    files.forEach((file) => {
      inject(file);
    });
  } catch (err) {
    console.error('Error injecting Google Tag Manager scripts:', err);
  }
}

async function inject(fileName) {
  const htmlFilePath = path.resolve(projectRoot, `../dist/entry-points/${fileName}`);
  const html = await fs.readFile(htmlFilePath, 'utf-8');

  const googleTagManagerHeadScript = `
          <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-ABCDEFGH');</script>
        <!-- End Google Tag Manager -->
  `;
  const injectedHtml = html.replace('</head>', `${googleTagManagerHeadScript}\n</head>`);

  const googleTagManagerBodyScript = `
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_CONTAINER_ID}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
  `;

  const injectedHtml2 = injectedHtml.replace('<body>', `<body>\n${googleTagManagerBodyScript}`);
  await fs.writeFile(htmlFilePath, injectedHtml2, 'utf-8');

  console.log(`Google Tag Manager scripts successfully injected (${fileName}).`);
}
