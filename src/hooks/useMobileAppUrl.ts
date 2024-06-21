import { useMemo } from 'react';

/*
  When/if deployer deploys the web app with smartbanner, "smartbanner:button-url-apple" and/or 
  "smartbanner:button-url-google" <meta> are set.
  This implementation assumes "smartbanner:button-url-apple" and "smartbanner:button-url-google" 
  are set to the same value with onelink or other redirect URL.
  Since there is no way for the desktop web app to know what mobile device the user is using, 
  we should give a onelink URL which redirects to either iOS or Android app store depending on 
  the mobile device used to scan the link.
*/
export const useMobileAppUrl = () => {
  const { appleAppStoreUrl, googlePlayStoreUrl } = useMemo(() => {
    return {
      appleAppStoreUrl: document
        .querySelector('meta[name="smartbanner:button-url-apple"]')
        ?.getAttribute('content'),
      googlePlayStoreUrl: document
        .querySelector('meta[name="smartbanner:button-url-google"]')
        ?.getAttribute('content'),
    };
  }, []);

  return {
    appleAppStoreUrl,
    googlePlayStoreUrl,
  };
};
