import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const BUGSNAG_API_KEY = process.env.BUGSNAG_API_KEY;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);
const htmlFilePath = path.resolve(projectRoot, '../dist/index.html');

try {
  const html = await fs.readFile(htmlFilePath, 'utf-8');

  const globalThisPolyfill = `
  <script>
    if (typeof globalThis === 'undefined') {
      (function () {
        if (typeof self !== 'undefined') {
          self.globalThis = self;
        } else if (typeof window !== 'undefined') {
          window.globalThis = window;
        } else if (typeof global !== 'undefined') {
          global.globalThis = global;
        }
      })();
    }
  </script>
`;

  const scripts = `
    <script src="//d2wy8f7a9ursnm.cloudfront.net/v7/bugsnag.min.js"></script>

    <script type="module">
      (function() {
        var BUGSNAG_API_KEY = '${BUGSNAG_API_KEY}';
        var walletType;

        if (BUGSNAG_API_KEY) {
          Bugsnag.start(BUGSNAG_API_KEY);
        }

        globalThis.addEventListener('dydx:identify', function (event) {
          var property = event.detail.property;
          var value = event.detail.propertyValue;

          switch (property) {
            case 'walletType':
              walletType = value;
              break;
            default:
              break;
          }
        });

        globalThis.addEventListener('dydx:log', function (event) {
          var error = event.detail.error;
          var metadata = event.detail.metadata;
          var location = event.detail.location;

          if (BUGSNAG_API_KEY && Bugsnag.isStarted()) {
            Bugsnag.notify(error, function (event) {
              event.context = location;
              if (metadata) {
                event.addMetadata('metadata', metadata);
              }
              if (walletType) {
                event.addMetadata('walletType', walletType);
              }
            });
          } else {
            console.warn(location, error, metadata);
          }
        });
      })();
    </script>

    <script type="module">
      import BugsnagPerformance from '//d2wy8f7a9ursnm.cloudfront.net/v1.0.0/bugsnag-performance.min.js'

      BugsnagPerformance.start({
        apiKey: '${BUGSNAG_API_KEY}',
        appVersion: '4.10.0',
        enabledReleaseStages: ['production', 'development', 'testing']
      })      
    </script>`;

  const injectedHtml = html.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n${globalThisPolyfill}\n${scripts}\n`
  );

  await fs.writeFile(htmlFilePath, injectedHtml, 'utf-8');

  console.log('Bugsnag scripts successfully injected.');
} catch (err) {
  console.error('Error injecting Bugsnag scripts:', err);
}
