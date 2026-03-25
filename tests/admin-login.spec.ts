import { test, expect } from '@playwright/test';

test.describe('Admin Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Firebase API calls
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ localId: 'test-uid', idToken: 'test-token', expiresIn: '3600' }),
    }));

    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ users: [{ localId: 'test-uid', email: 'admin@test.com', emailVerified: true }] }),
    }));

    // Mock the Firestore GET for the user profile
    await page.route('**/databases/(default)/documents/users/test-uid**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'projects/dentcare-47681/databases/(default)/documents/users/test-uid',
        fields: {
          role: { stringValue: 'admin' },
          name: { stringValue: 'Admin User' }
        },
        createTime: '2026-03-01T00:00:00Z',
        updateTime: '2026-03-01T00:00:00Z'
      }),
    }));

    // Mock additional common Firebase calls to avoid timeouts
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signUp**', route => route.abort());
    await page.route('**/securetoken.googleapis.com/v1/token**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'fake-token', expires_in: '3600' }),
    }));
  });

  test('should load page and display form elements', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-login.html?testMode=true');

    await expect(page.locator('.title-auth')).toHaveText('Admin Portal');
    await expect(page.locator('#adminEmail')).toBeVisible();
    await expect(page.locator('#adminPassword')).toBeVisible();
    await expect(page.locator('#loginBtn')).toHaveText(/Secure Login/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-login.html?testMode=true');
    await page.fill('#adminEmail', 'wrong@admin.com');
    await page.fill('#adminPassword', 'wrong');
    await page.click('#loginBtn');

    // Expect error message via testMode branch
    await expect(page.locator('#loginMsg')).toBeVisible();
    await expect(page.locator('#loginMsg')).toHaveClass(/err/);
    await expect(page.locator('#loginMsg')).toContainText('Unauthorized access');
  });

  test('should handle valid form submission', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-login.html?testMode=true');
    await page.fill('#adminEmail', 'admin@dentalcare.com');
    await page.fill('#adminPassword', 'password123');
    
    await page.click('#loginBtn');
    await expect(page.locator('#loginBtn')).toContainText('Authenticating');
    
    // TestMode will show "Redirecting..." after 500ms
    await expect(page.locator('#loginMsg')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#loginMsg')).toContainText('Redirecting');
  });

  test('should have back link', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-login.html?testMode=true');
    await expect(page.locator('.back-link')).toBeVisible();
    await expect(page.locator('.back-link')).toContainText('Return to Main');
  });
});
