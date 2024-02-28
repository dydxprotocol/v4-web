import { $, browser, expect } from '@wdio/globals';

describe('Smoke test', () => {
  it('should authenticate with vercel and load website', async () => {
    await browser.url(process.env.E2E_ENVIRONMENT_URL || '');
    browser.setWindowSize(1920, 1080);

    await $('input[type=password]').setValue(process.env.E2E_ENVIRONMENT_PASSWORD || '');
    await $('button.submit').click();

    await expect($('main')).toBeExisting();
    await expect($('header')).toBeExisting();
    await expect($('footer')).toBeExisting();
  });
});
