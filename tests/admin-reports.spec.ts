import { test, expect } from '@playwright/test';

test.describe('Admin Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock session state and Firebase global mock via script
    await page.addInitScript(() => {
      // Mock localStorage for the dentCareUser
      window.localStorage.setItem('dentCareUser', JSON.stringify({
        uid: 'admin-uid',
        email: 'admin@dentalcare.com',
        role: 'admin',
        name: 'System Admin'
      }));
    });

    // 2. Intercept Firebase API calls
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:lookup**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ users: [{ localId: 'admin-uid', email: 'admin@dentalcare.com', emailVerified: true }] }),
    }));

    await page.route('**/databases/(default)/documents/users/admin-uid**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        name: 'projects/dentcare-47681/databases/(default)/documents/users/admin-uid', 
        fields: { role: { stringValue: 'admin' }, name: { stringValue: 'System Admin' } } 
      }),
    }));

    // 3. Mock runQuery for Doctors and Appointments
    await page.route('**/databases/(default)/documents:runQuery**', async (route) => {
      const postData = route.request().postDataJSON();
      const structuredQuery = postData?.structuredQuery;
      
      // Determine if searching for doctors
      const fieldFilter = structuredQuery?.where?.compositeFilter?.filters?.[0]?.fieldFilter || structuredQuery?.where?.fieldFilter;
      if (fieldFilter?.value?.stringValue === 'doctor') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { document: { name: 'projects/dentcare-47681/databases/(default)/documents/users/doc1', fields: { name: { stringValue: 'Dr. Smith' } }, createTime: '2026-03-01T00:00:00Z', updateTime: '2026-03-01T00:00:00Z' } },
            { document: { name: 'projects/dentcare-47681/databases/(default)/documents/users/doc2', fields: { name: { stringValue: 'Dr. Jones' } }, createTime: '2026-03-01T00:00:00Z', updateTime: '2026-03-01T00:00:00Z' } }
          ]),
        });
      }

      // Default appointments list for report generation
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            document: { 
              name: 'app1',
              fields: { 
                userName: { stringValue: 'John Doe' },
                userEmail: { stringValue: 'john@example.com' },
                doctor: { stringValue: 'Dr. Smith' },
                bookingType: { stringValue: 'Root Canal' },
                date: { stringValue: '2026-03-20' },
                time: { stringValue: '10:00 AM' },
                status: { stringValue: 'Confirmed' }
              } 
            } 
          },
          { 
            document: { 
              name: 'app2',
              fields: { 
                userName: { stringValue: 'Jane Smith' },
                userEmail: { stringValue: 'jane@example.com' },
                doctor: { stringValue: 'Dr. Jones' },
                bookingType: { stringValue: 'Teeth Whitening' },
                date: { stringValue: '2026-03-20' },
                time: { stringValue: '11:00 AM' },
                status: { stringValue: 'Pending' }
              } 
            } 
          }
        ]),
      });
    });
  });

  test('should load page and populate doctor dropdown', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-reports.html?testMode=true');
    await expect(page.locator('h2')).toHaveText('Advanced Reports');
    
    // Wait for the dropdown to be populated from the mock
    const doctorSelect = page.locator('#doctorSelect');
    await expect(doctorSelect.locator('option')).toHaveCount(3, { timeout: 10000 });
  });

  test('should generate Date-wise report', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-reports.html?testMode=true');
    await page.fill('#startDate', '2026-03-20');
    
    // Trigger generation
    await page.click('#generateBtn');

    const tableBody = page.locator('#reportResults');
    // The testMode mock provides 2 appointments
    await expect(tableBody.locator('tr')).toHaveCount(2, { timeout: 5000 });
    await expect(tableBody).toContainText('John Doe');
  });

  test('should filter by Service client-side', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-reports.html?testMode=true');
    await page.selectOption('#reportType', 'service');
    await page.selectOption('#serviceSelect', 'Teeth Whitening');
    await page.click('#generateBtn');

    const tableBody = page.locator('#reportResults');
    // Should only show Jane Smith (Teeth Whitening)
    await expect(tableBody.locator('tr')).toHaveCount(1, { timeout: 5000 });
    await expect(tableBody).toContainText('Jane Smith');
    await expect(tableBody).not.toContainText('John Doe');
  });

  test('should search patient history client-side', async ({ page }) => {
    await page.goto('http://localhost:3000/admin-reports.html?testMode=true');
    await page.selectOption('#reportType', 'patient');
    await page.fill('#patientSearch', 'John');
    await page.click('#generateBtn');

    const tableBody = page.locator('#reportResults');
    await expect(tableBody.locator('tr')).toHaveCount(1, { timeout: 5000 });
    await expect(tableBody).toContainText('John Doe');
  });
});
