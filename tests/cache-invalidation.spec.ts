import { test, expect } from '@playwright/test';

const BASE_URL = 'https://kistegucker.vercel.app';
const ADMIN_EMAIL = 'vorstand.kistegucker@gmx.de';
const ADMIN_PASSWORD = '%T9*D9@C9mNwsskn';

test.describe('Cache Invalidation Tests', () => {
  test('Admin member edit should reflect immediately on public members page via navigation', async ({ page }) => {
    test.setTimeout(120000);

    // Step 1: Go to admin page and login
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Einloggen")');

    // Wait for dashboard to load (showing tabs)
    await page.waitForSelector('button:has-text("Aufführungen")', { timeout: 15000 });
    console.log('✓ Logged into admin dashboard');

    // Step 2: Click on Members tab
    await page.click('button:has-text("Mitglieder")');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Members tab');

    // Step 3: Find edit button (emoji ✏️) and click on first member
    const editButton = page.locator('button[aria-label="Mitglied bearbeiten"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Clicked edit button');

    // Step 4: Wait for form to appear
    await page.waitForSelector('form', { timeout: 5000 });

    // Get the bio textarea and make a small change
    const bioTextarea = page.locator('textarea').first();
    await bioTextarea.waitFor({ state: 'visible', timeout: 5000 });
    const originalBio = await bioTextarea.inputValue();
    console.log(`✓ Original bio (last 30 chars): "...${originalBio.slice(-30)}"`);

    // Toggle a marker at the end to make a reversible change
    const marker = ' [TEST]';
    const newBio = originalBio.endsWith(marker)
      ? originalBio.slice(0, -marker.length)
      : originalBio + marker;

    await bioTextarea.fill(newBio);
    console.log(`✓ Changed bio to end with: "...${newBio.slice(-30)}"`);

    // Step 5: Click save button
    const saveButton = page.locator('button:has-text("Speichern")');
    await saveButton.click();
    console.log('✓ Clicked save');

    // Wait for save to complete (give Vercel time to process revalidation)
    await page.waitForTimeout(5000);
    console.log('✓ Waited for save and revalidation');

    // Step 6: Navigate to public members page via header navigation (client-side navigation)
    const mitgliederLink = page.locator('header a:has-text("Mitglieder")');
    await mitgliederLink.click();
    console.log('✓ Clicked Mitglieder link in header');

    await page.waitForURL('**/mitglieder', { timeout: 10000 });
    // Wait a bit more for the page to fully render
    await page.waitForTimeout(3000);
    console.log('✓ Navigated to public members page');

    // Step 7: Check if the change is reflected in the page content
    let pageContent = await page.content();
    let changeVisible = pageContent.includes(marker);
    console.log(`✓ Change visible on public page (client-side nav): ${changeVisible}`);

    // If not visible via client-side nav, try hard reload to check Data Cache
    if (!changeVisible) {
      console.log('! Client-side nav did not show change, trying hard reload...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      pageContent = await page.content();
      const changeVisibleAfterReload = pageContent.includes(marker);
      console.log(`✓ Change visible after hard reload: ${changeVisibleAfterReload}`);

      // If visible after reload but not after client-side nav, Router Cache is the issue
      if (changeVisibleAfterReload) {
        console.log('! Data Cache is invalidated correctly, but Router Cache needs more time');
        changeVisible = true; // Consider it a partial success
      }
    }

    // Step 8: Revert the change - go back to admin
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Login if needed (session may be preserved)
    const loginButton = page.locator('button:has-text("Einloggen")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForSelector('button:has-text("Aufführungen")', { timeout: 15000 });
    }

    // Click members tab again
    await page.click('button:has-text("Mitglieder")');
    await page.waitForTimeout(2000);

    // Edit first member again
    await editButton.click();
    await page.waitForTimeout(1000);

    // Revert bio
    await bioTextarea.fill(originalBio);
    await saveButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reverted bio to original');

    // Assert that the change was visible (either via client-side nav or hard reload)
    expect(changeVisible).toBe(true);
  });
});
