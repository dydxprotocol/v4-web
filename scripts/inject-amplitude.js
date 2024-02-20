import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY;
const AMPLITUDE_SERVER_URL = process.env.AMPLITUDE_SERVER_URL;

const currentPath = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(currentPath);
const htmlFilePath = path.resolve(projectRoot, '../dist/index.html');

if (AMPLITUDE_API_KEY) {
  try {
    const html = await fs.readFile(htmlFilePath, 'utf-8');

    const amplitudeCdnScript = `<script type="text/javascript">
        !function(){"use strict";!function(e,t){var n=e.amplitude||{_q:[],_iq:{}};if(n.invoked)e.console&&console.error&&console.error("Amplitude snippet has been loaded.");else{var r=function(e,t){e.prototype[t]=function(){return this._q.push({name:t,args:Array.prototype.slice.call(arguments,0)}),this}},s=function(e,t,n){return function(r){e._q.push({name:t,args:Array.prototype.slice.call(n,0),resolve:r})}},o=function(e,t,n){e[t]=function(){if(n)return{promise:new Promise(s(e,t,Array.prototype.slice.call(arguments)))}}},i=function(e){for(var t=0;t<m.length;t++)o(e,m[t],!1);for(var n=0;n<g.length;n++)o(e,g[n],!0)};n.invoked=!0;var u=t.createElement("script");u.type="text/javascript",u.integrity="sha384-BVo5ZjsjH373rWbcjz9Qjb2L6BgLwLADcZtZZPu3nMl8+7LPDhi1NcUEf0Ate41Y",u.crossOrigin="anonymous",u.async=!0,u.src="/libs/amplitude-analytics-browser-2.0.0-min.js",u.onload=function(){e.amplitude.runQueuedFunctions||console.log("[Amplitude] Error: could not load SDK")};var a=t.getElementsByTagName("script")[0];a.parentNode.insertBefore(u,a);for(var c=function(){return this._q=[],this},p=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove","getUserProperties"],l=0;l<p.length;l++)r(c,p[l]);n.Identify=c;for(var d=function(){return this._q=[],this},f=["getEventProperties","setProductId","setQuantity","setPrice","setRevenue","setRevenueType","setEventProperties"],v=0;v<f.length;v++)r(d,f[v]);n.Revenue=d;var m=["getDeviceId","setDeviceId","getSessionId","setSessionId","getUserId","setUserId","setOptOut","setTransport","reset","extendSession"],g=["init","add","remove","track","logEvent","identify","groupIdentify","setGroup","revenue","flush"];i(n),n.createInstance=function(e){return n._iq[e]={_q:[]},i(n._iq[e]),n._iq[e]},e.amplitude=n}}(window,document)}();
        </script>
        `;

    const amplitudeListenerScript = `<script type="module">
      !(function () {
        var e = "${AMPLITUDE_API_KEY}";
        e &&
          (globalThis.amplitude.init(e${
            AMPLITUDE_SERVER_URL
              ? `, undefined, {
                serverUrl: "${AMPLITUDE_SERVER_URL}"
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

    console.log('Amplitude scripts successfully injected.');
  } catch (err) {
    console.error('Error injecting Amplitude scripts:', err);
  }
}
