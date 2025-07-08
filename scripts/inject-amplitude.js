import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY;
const AMPLITUDE_SERVER_URL = process.env.AMPLITUDE_SERVER_URL;
const AMPLITUDE_SERVER_ZONE = process.env.AMPLITUDE_SERVER_ZONE || 'US';

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);

if (AMPLITUDE_API_KEY) {
  try {
    const files = await fs.readdir('entry-points');
    for (const file of files) {
      inject(file);
    }
  } catch (err) {
    console.error('Error injecting Amplitude scripts:', err);
  }
}

async function inject(fileName) {
  const htmlFilePath = path.resolve(projectRoot, `../dist/entry-points/${fileName}`);
  const html = await fs.readFile(htmlFilePath, 'utf-8');

  const amplitudeCdnScript =
    AMPLITUDE_SERVER_ZONE === 'US'
      ? `<script src="https://cdn.amplitude.com/script/AMPLITUDE_API_KEY.js"></script>`
      : `<script src="https://cdn.eu.amplitude.com/script/AMPLITUDE_API_KEY.js"></script>`;

  const amplitudeListenerScript = `<script type="module">
    !(function () {
      var e = "${AMPLITUDE_API_KEY}";
      e &&
        (globalThis.amplitude.init(e${
          AMPLITUDE_SERVER_URL
            ? `, undefined, {
              autoCapture: true,
              serverUrl: "${AMPLITUDE_SERVER_URL}",
              serverZone: "${AMPLITUDE_SERVER_ZONE}"
            }`
            : ''
        }),
        globalThis.amplitude.setOptOut(!1),
        globalThis.addEventListener("dydx:track", function (e) {
          var t = e.detail.eventType,
            d = e.detail.eventData;
          globalThis.amplitude.track(t, d);
        }),
        globalThis.addEventListener("dydx:identify", function (e) {
          var t = e.detail.property,
            d = e.detail.propertyValue;
          if ("walletAddress" === t) globalThis.amplitude.setUserId(d);
          else {
            var i = new globalThis.amplitude.Identify();
            i.set(t, d), globalThis.amplitude.identify(i);
          }
        }),
        console.log("Amplitude enabled."));
    })();
  </script>`;

  const injectedHtml = html.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n${amplitudeCdnScript}\n${amplitudeListenerScript}`
  );

  await fs.writeFile(htmlFilePath, injectedHtml, 'utf-8');

  console.log(`Amplitude scripts successfully injected (${fileName}).`);
}
