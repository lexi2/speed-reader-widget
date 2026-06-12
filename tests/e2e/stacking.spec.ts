import { test, expect } from '@playwright/test';

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/ghost-post-fixture.html');
    await page.locator('button.rsvp-reader-trigger').click();
  });

  const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

  test('reader mounts in portal root on body', async ({ page }) => {
    const parentId = await reader(page).evaluate((el) => el.parentElement?.id ?? null);
    expect(parentId).toBe('rsvp-portal-root');
  });

  test('reader controls sit above a high z-index body widget', async ({ page }) => {
    await page.evaluate(() => {
      const blocker = document.createElement('div');
      blocker.id = 'rsvp-test-blocker';
      blocker.textContent = 'Help us improve';
      blocker.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;height:120px;z-index:2147483646;background:#fff;border-top:1px solid #ccc;';
      document.body.appendChild(blocker);
    });

    const stacking = await page.evaluate(() => {
      const portal = document.getElementById('rsvp-portal-root');
      const blocker = document.getElementById('rsvp-test-blocker') as HTMLElement;
      const portalZ = portal ? parseInt(getComputedStyle(portal).zIndex, 10) : 0;
      const blockerZ = parseInt(getComputedStyle(blocker).zIndex, 10);
      return { portalZ, blockerZ };
    });

    expect(stacking.portalZ).toBeGreaterThan(stacking.blockerZ);
    await reader(page).locator('[data-control="play"]').click({ trial: true });
  });
});

test.describe('desktop inline', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('inline mode opens reader directly below the trigger', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('button.rsvp-reader-trigger').click();

    const placement = await page.evaluate(() => {
      const trigger = document.querySelector('[data-rsvp-trigger]');
      const reader = document.querySelector('rsvp-reader[data-rsvp-auto]');
      return {
        followsTrigger: reader?.previousElementSibling === trigger,
        inPortal: reader?.parentElement?.id === 'rsvp-portal-root',
      };
    });

    expect(placement.followsTrigger).toBe(true);
    expect(placement.inPortal).toBe(false);
  });
});

test.describe('desktop expanded', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('button.rsvp-reader-trigger').click();
    await page.locator('rsvp-reader[data-rsvp-auto] [data-control="fullscreen"]').click();
    await expect(page.locator('rsvp-reader[data-rsvp-auto]')).toHaveAttribute('data-expanded', '');
  });

  const reader = (page: import('@playwright/test').Page) => page.locator('rsvp-reader[data-rsvp-auto]');

  test('expanded reader stays inline in the document', async ({ page }) => {
    const placement = await page.evaluate(() => {
      const trigger = document.querySelector('[data-rsvp-trigger]');
      const reader = document.querySelector('rsvp-reader[data-rsvp-auto]');
      return {
        followsTrigger: reader?.previousElementSibling === trigger,
        inPortal: reader?.parentElement?.id === 'rsvp-portal-root',
      };
    });
    expect(placement.followsTrigger).toBe(true);
    expect(placement.inPortal).toBe(false);
  });

  test('expanded reader controls sit above a high z-index body widget', async ({ page }) => {
    await page.evaluate(() => {
      const blocker = document.createElement('div');
      blocker.id = 'rsvp-test-blocker';
      blocker.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;height:120px;z-index:2147483646;background:#fff;';
      document.body.appendChild(blocker);
    });

    const stacking = await page.evaluate(() => {
      const readerEl = document.querySelector('rsvp-reader[data-rsvp-auto]') as HTMLElement;
      const blocker = document.getElementById('rsvp-test-blocker') as HTMLElement;
      const readerZ = parseInt(getComputedStyle(readerEl).zIndex, 10);
      const blockerZ = parseInt(getComputedStyle(blocker).zIndex, 10);
      return { readerZ, blockerZ };
    });

    expect(stacking.readerZ).toBeGreaterThan(stacking.blockerZ);
    await reader(page).locator('[data-control="play"]').click({ trial: true });
  });
});
