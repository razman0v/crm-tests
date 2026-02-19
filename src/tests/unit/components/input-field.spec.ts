import { test, expect, Page } from '@playwright/test';
import { InputField } from '../../../../src/pages/components/atoms/input-field.atom';

/**
 * Unit tests for InputField Atom Component
 * 
 * Tests cover:
 * - fill() method with wait-clear-fill pattern
 * - type() method with keystroke delay
 * - getValue() retrieval
 * - clear() operation
 * - Visibility and enabled state checks
 * - Error handling for missing elements
 */

test.describe('InputField Atom Component', () => {
  let page: Page;
  const testUrl = 'data:text/html,<input id="test-input" placeholder="Test input" />';

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(testUrl);
  });

  test('should fill input field with value', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.fill('test value');
    const value = await input.getValue();

    expect(value).toBe('test value');
  });

  test('should clear existing value before filling', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    // Set initial value
    await input.fill('initial value');
    let value = await input.getValue();
    expect(value).toBe('initial value');

    // Fill with new value (should clear first)
    await input.fill('new value');
    value = await input.getValue();
    expect(value).toBe('new value');
  });

  test('should type text character by character with delay', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    const startTime = Date.now();
    await input.type('hello', 50);
    const duration = Date.now() - startTime;

    const value = await input.getValue();
    expect(value).toBe('hello');
    
    // With 50ms delay and 5 characters, should take roughly 200-250ms minimum
    expect(duration).toBeGreaterThanOrEqual(200);
  });

  test('should get input value', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.fill('get value test');
    const value = await input.getValue();

    expect(value).toBe('get value test');
  });

  test('should clear input field', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.fill('clear test');
    await input.clear();
    const value = await input.getValue();

    expect(value).toBe('');
  });

  test('should detect visible input', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    const isVisible = await input.isVisible();
    expect(isVisible).toBe(true);
  });

  test('should detect invisible input', async () => {
    const inputLocator = page.locator('#test-input');
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).style.display = 'none';
    });

    const input = new InputField(inputLocator);
    const isVisible = await input.isVisible();

    expect(isVisible).toBe(false);
  });

  test('should detect enabled input', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    const isEnabled = await input.isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should detect disabled input', async () => {
    const inputLocator = page.locator('#test-input');
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).disabled = true;
    });

    const input = new InputField(inputLocator);
    const isEnabled = await input.isEnabled();

    expect(isEnabled).toBe(false);

    // Re-enable for other tests
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).disabled = false;
    });
  });

  test('should get placeholder text', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    const placeholder = await input.getPlaceholder();
    expect(placeholder).toBe('Test input');
  });

  test('should focus input field', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.focus();

    const focused = await page.evaluate(() => {
      return document.activeElement?.id === 'test-input';
    });

    expect(focused).toBe(true);
  });

  test('should blur input field', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.focus();
    await input.blur();

    const focused = await page.evaluate(() => {
      return document.activeElement?.id === 'test-input';
    });

    expect(focused).toBe(false);
  });

  test('should click input field', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.click();

    const focused = await page.evaluate(() => {
      return document.activeElement?.id === 'test-input';
    });

    expect(focused).toBe(true);
  });

  test('should handle fill on non-existent element with timeout', async () => {
    const inputLocator = page.locator('#non-existent');
    const input = new InputField(inputLocator);

    await expect(input.fill('test', 1000)).rejects.toThrow();
  });

  test('should handle type on disabled input', async () => {
    const inputLocator = page.locator('#test-input');
    
    // Ensure element is enabled first
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).disabled = false;
    });

    // Now disable it
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).disabled = true;
    });

    const input = new InputField(inputLocator);

    // Playwright will throw when trying to interact with disabled element
    await input.type('test');
    const value = await input.getValue();
    expect(value).toBe('');

    // Cleanup for subsequent tests
    await page.evaluate(() => {
      (document.getElementById('test-input') as any).disabled = false;
    });
  });

  test('should fill multiple times in sequence', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.fill('first');
    expect(await input.getValue()).toBe('first');

    await input.fill('second');
    expect(await input.getValue()).toBe('second');

    await input.fill('third');
    expect(await input.getValue()).toBe('third');
  });

  test('should type after fill maintains correct value', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    await input.fill('initial');
    await input.type(' + typed');
    const value = await input.getValue();

    expect(value).toBe('initial + typed');
  });

  test('should clear and fill multiple times', async () => {
    const inputLocator = page.locator('#test-input');
    const input = new InputField(inputLocator);

    for (let i = 0; i < 3; i++) {
      const testValue = `test-${i}`;
      await input.fill(testValue);
      expect(await input.getValue()).toBe(testValue);
      await input.clear();
      expect(await input.getValue()).toBe('');
    }
  });
});
