import { test, expect } from '@playwright/test';

const BASE_URL = 'https://kistegucker.vercel.app';
const ADMIN_EMAIL = 'vorstand.kistegucker@gmx.de';
const ADMIN_PASSWORD = '%T9*D9@C9mNwsskn';

test.describe('Cache Invalidation Tests', () => {
  test('Admin event edit should reflect immediately on public event detail page', async ({ page }) => {
    test.setTimeout(150000);

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

    // Step 2: Make sure we're on the Events tab (Aufführungen)
    await page.click('button:has-text("Aufführungen")');
    await page.waitForTimeout(2000);
    console.log('✓ On Events tab');

    // Step 3: Find and click edit on "App ins Märchenland"
    const editButton = page.locator('button[title="Bearbeiten"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await page.waitForTimeout(1500);
    console.log('✓ Clicked edit button');

    // Step 4: Find a cast entry and modify the role
    // The role input is in a label with text "Rolle"
    await page.waitForTimeout(2000);
    const roleLabel = page.locator('label:has-text("Rolle")').first();
    const firstRoleInput = roleLabel.locator('input');
    await firstRoleInput.waitFor({ state: 'visible', timeout: 10000 });
    const originalRole = await firstRoleInput.inputValue();
    console.log(`✓ Original role: "${originalRole}"`);

    // Toggle a marker to make a reversible change
    const marker = '-TEST';
    const newRole = originalRole.endsWith(marker)
      ? originalRole.slice(0, -marker.length)
      : originalRole + marker;

    await firstRoleInput.fill(newRole);
    console.log(`✓ Changed role to: "${newRole}"`);

    // Step 5: Click save button
    const saveButton = page.locator('button:has-text("Speichern")');
    await saveButton.click();
    console.log('✓ Clicked save');

    // Wait for save to complete
    await page.waitForTimeout(5000);
    console.log('✓ Waited for save and revalidation');

    // Check if we're still logged in (not redirected)
    const stillInAdmin = await page.locator('button:has-text("Aufführungen")').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Still in admin after save: ${stillInAdmin}`);

    // Step 6: Navigate to public event detail page via menu
    const theaterstückeLink = page.locator('header a:has-text("Theaterstücke")');
    await theaterstückeLink.click();
    await page.waitForURL('**/events', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to events list');

    // Click on first event to go to detail page
    const eventLink = page.locator('a[href*="/events/"]').first();
    await eventLink.click();
    await page.waitForURL('**/events/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to event detail page');

    // Step 7: Check if the change is reflected
    const pageContent = await page.content();
    const changeVisible = pageContent.includes(newRole);
    console.log(`✓ Change visible on event detail page: ${changeVisible}`);

    // Step 8: Revert the change
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const loginButton = page.locator('button:has-text("Einloggen")');
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForSelector('button:has-text("Aufführungen")', { timeout: 15000 });
    }

    await page.click('button:has-text("Aufführungen")');
    await page.waitForTimeout(2000);
    await editButton.click();
    await page.waitForTimeout(1500);

    // Revert role
    await firstRoleInput.fill(originalRole);
    await saveButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Reverted role to original');

    // Assert
    expect(changeVisible).toBe(true);
    expect(stillInAdmin).toBe(true);
  });
});
