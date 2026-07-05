# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Register Page >> register returns to login on success
- Location: e2e\auth.spec.js:81:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Redirecting to login').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Redirecting to login').first()

```

```yaml
- text: 🎬
- heading "MediaVerse" [level=1]
- heading "Create Account" [level=2]
- paragraph: Join MediaVerse today
- text: avatar is required Full Name
- textbox "John Doe": E2E Register Test
- text: Username @
- textbox "johndoe": e2euser_1783229609136
- text: Email
- textbox "name@example.com": e2e_reg_1783229609136@test.com
- text: Password
- textbox "Create a strong password": E2EPass123!
- button
- text: avatar.png Cover
- button "Create Account"
- paragraph:
  - text: Already have an account?
  - link "Sign In":
    - /url: /login
```

# Test source

```ts
  1   | // @ts-check
  2   | import { test, expect } from '@playwright/test';
  3   | import { goTo,
  4   |   registerUser,
  5   |   expectUrl, } from './helpers.js';
  6   | 
  7   | // ─── Landing Page ──────────────────────────────────────────
  8   | 
  9   | test.describe('Landing Page', () => {
  10  |   test('landing page loads at /', async ({ page }) => {
  11  |     await goTo(page, '/');
  12  |     await expect(page).toHaveTitle(/MediaVerse/);
  13  |     await expect(page.locator('text=Your Universe of').first()).toBeVisible();
  14  |   });
  15  | 
  16  |   test('landing page shows "Enter YouTube" and "Enter Twitter" buttons', async ({ page }) => {
  17  |     await goTo(page, '/');
  18  |     const enterYoutube = page.getByRole('button', { name: /Enter YouTube/i });
  19  |     const enterTwitter = page.getByRole('button', { name: /Enter Twitter/i });
  20  |     await expect(enterYoutube).toBeVisible();
  21  |     await expect(enterTwitter).toBeVisible();
  22  |   });
  23  | 
  24  |   test('landing page "Sign In" nav link navigates to /login', async ({ page }) => {
  25  |     await goTo(page, '/');
  26  |     await page.getByRole('button', { name: /Sign In/i }).click();
  27  |     await expectUrl(page, '/login');
  28  |   });
  29  | });
  30  | 
  31  | // ─── Login Page ────────────────────────────────────────────
  32  | 
  33  | test.describe('Login Page', () => {
  34  |   test('login page loads at /login with form visible', async ({ page }) => {
  35  |     await goTo(page, '/login');
  36  |     await expect(page).toHaveTitle(/MediaVerse/);
  37  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  38  |     const passwordField = page.locator('input[placeholder="Enter your password"]');
  39  |     await expect(passwordField).toBeVisible();
  40  |     await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  41  |   });
  42  | 
  43  |   test('login with invalid credentials shows error message', async ({ page }) => {
  44  |     await goTo(page, '/login');
  45  |     await page.locator('input[type="email"]').fill('invalid@nonexistent.com');
  46  |     await page.locator('input[placeholder="Enter your password"]').fill('wrongpassword');
  47  |     await page.getByRole('button', { name: 'Sign In' }).click();
  48  |     await expect(page.locator('.text-red-400').first()).toBeVisible({ timeout: 10000 });
  49  |   });
  50  | 
  51  |   test('login with valid credentials redirects to /youtube/feed', async ({ page, request }) => {
  52  |     const { user } = await registerUser(request);
  53  |     await goTo(page, '/login');
  54  |     await page.locator('input[type="email"]').fill(user.email);
  55  |     await page.locator('input[placeholder="Enter your password"]').fill(user.password);
  56  |     await page.getByRole('button', { name: 'Sign In' }).click();
  57  |     await expectUrl(page, '/youtube/feed');
  58  |   });
  59  | 
  60  |   test('login page has link to register page', async ({ page }) => {
  61  |     await goTo(page, '/login');
  62  |     await page.getByRole('link', { name: /Create Account/i }).click();
  63  |     await expectUrl(page, '/register');
  64  |   });
  65  | });
  66  | 
  67  | // ─── Register Page ─────────────────────────────────────────
  68  | 
  69  | test.describe('Register Page', () => {
  70  |   test('register page loads at /register with form inputs', async ({ page }) => {
  71  |     await goTo(page, '/register');
  72  |     await expect(page).toHaveTitle(/MediaVerse/);
  73  |     await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible();
  74  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  75  |     await expect(page.locator('input[placeholder="johndoe"]')).toBeVisible();
  76  |     const passwordField = page.locator('input[placeholder="Create a strong password"]');
  77  |     await expect(passwordField).toBeVisible();
  78  |     await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  79  |   });
  80  | 
  81  |   test('register returns to login on success', async ({ page }) => {
  82  |     const timestamp = Date.now();
  83  |     await goTo(page, '/register');
  84  |     await page.locator('input[placeholder="John Doe"]').fill('E2E Register Test');
  85  |     await page.locator('input[type="email"]').fill(`e2e_reg_${timestamp}@test.com`);
  86  |     await page.locator('input[placeholder="johndoe"]').fill(`e2euser_${timestamp}`);
  87  |     await page.locator('input[placeholder="Create a strong password"]').fill('E2EPass123!');
  88  |     await page.locator('input#avatar-upload').setInputFiles({
  89  |       name: 'avatar.png',
  90  |       mimeType: 'image/png',
  91  |       buffer: Buffer.from('mock image data')
  92  |     });
  93  |     await page.getByRole('button', { name: /Create Account/i }).click();
> 94  |     await expect(page.locator('text=Redirecting to login').first()).toBeVisible({ timeout: 10000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  95  |     await expectUrl(page, '/login');
  96  |   });
  97  | 
  98  |   test('register page has link to login page', async ({ page }) => {
  99  |     await goTo(page, '/register');
  100 |     await page.getByRole('link', { name: /Sign In/i }).click();
  101 |     await expectUrl(page, '/login');
  102 |   });
  103 | });
  104 | 
  105 | // ─── Protected Routes ──────────────────────────────────────
  106 | 
  107 | test.describe('Protected Routes', () => {
  108 |   test('/youtube/upload redirects to /login when unauthenticated', async ({ page }) => {
  109 |     await goTo(page, '/youtube/upload');
  110 |     await expectUrl(page, '/login');
  111 |   });
  112 | 
  113 |   test('/youtube/dashboard redirects to /login when unauthenticated', async ({ page }) => {
  114 |     await goTo(page, '/youtube/dashboard');
  115 |     await expectUrl(page, '/login');
  116 |   });
  117 | 
  118 |   test('/youtube/settings redirects to /login when unauthenticated', async ({ page }) => {
  119 |     await goTo(page, '/youtube/settings');
  120 |     await expectUrl(page, '/login');
  121 |   });
  122 | });
  123 | 
  124 | // ─── Logout ────────────────────────────────────────────────
  125 | 
  126 | test.describe('Logout', () => {
  127 |   test('logout via channel page clears session and redirects to /login', async ({ page, request }) => {
  128 |     const { user } = await registerUser(request);
  129 |     await goTo(page, '/login');
  130 |     await page.locator('input[type="email"]').fill(user.email);
  131 |     await page.locator('input[placeholder="Enter your password"]').fill(user.password);
  132 |     await page.getByRole('button', { name: 'Sign In' }).click();
  133 |     await expectUrl(page, '/youtube/feed');
  134 | 
  135 |     await goTo(page, `/youtube/channel/${user.username}`);
  136 |     await page.waitForLoadState('networkidle');
  137 |     await page.getByRole('button', { name: /Logout/i }).click();
  138 |     await expectUrl(page, '/login');
  139 |   });
  140 | });
  141 | 
  142 | // ─── Navbar Links ──────────────────────────────────────────
  143 | 
  144 | test.describe('Navbar Links', () => {
  145 |   test('header Sign In navigates to /login', async ({ page }) => {
  146 |     await goTo(page, '/');
  147 |     const signInBtn = page.locator('.landing-nav__cta');
  148 |     await signInBtn.click();
  149 |     await expectUrl(page, '/login');
  150 |   });
  151 | });
  152 | 
```