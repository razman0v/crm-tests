import { test, expect, Page } from '@playwright/test';
import { SelectDropdown } from '../../../../src/pages/components/atoms/select-dropdown.atom';

/**
 * Unit tests for SelectDropdown Atom Component
 * 
 * Tests cover:
 * - selectByLabel() method for custom dropdowns and HTML <select>
 * - selectByValue() method for standard HTML <select>
 * - getSelectedLabel() and getSelectedValue() retrieval
 * - getAllOptions() for option enumeration
 * - Visibility and enabled state checks
 * - hasOption() and getOptionCount() utilities
 */

test.describe('SelectDropdown Atom Component', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Create a test page with both standard <select> and custom dropdown
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .custom-dropdown {
            position: relative;
            width: 200px;
            padding: 8px;
            border: 1px solid #ccc;
            cursor: pointer;
            background: white;
          }
          .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            border: 1px solid #ccc;
            background: white;
            z-index: 1000;
            display: none;
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .custom-dropdown.open .dropdown-menu {
            display: block;
          }
          .dropdown-menu li {
            padding: 8px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
          }
          .dropdown-menu li:hover {
            background: #f0f0f0;
          }
          .dropdown-menu li.selected {
            background: #0066cc;
            color: white;
          }
        </style>
      </head>
      <body>
        <!-- Standard HTML select -->
        <label for="standard-select">Standard Select:</label>
        <select id="standard-select">
          <option value="">-- Choose --</option>
          <option value="opt1">Option 1</option>
          <option value="opt2">Option 2</option>
          <option value="opt3">Option 3</option>
        </select>

        <!-- Custom dropdown -->
        <div id="custom-dropdown" class="custom-dropdown">
          <span id="selected-text">Choose option</span>
          <ul class="dropdown-menu">
            <li data-value="custom1">Custom Option 1</li>
            <li data-value="custom2">Custom Option 2</li>
            <li data-value="custom3">Custom Option 3</li>
          </ul>
        </div>

        <script>
          const dropdown = document.getElementById('custom-dropdown');
          dropdown.addEventListener('click', () => {
            dropdown.classList.toggle('open');
          });
          
          document.querySelectorAll('.dropdown-menu li').forEach(item => {
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              const value = item.getAttribute('data-value');
              const text = item.textContent;
              document.getElementById('selected-text').textContent = text;
              dropdown.classList.remove('open');
            });
          });

          // Close dropdown when clicking outside
          document.addEventListener('click', (e) => {
            if (e.target !== dropdown && !dropdown.contains(e.target)) {
              dropdown.classList.remove('open');
            }
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(testHtml);
  });

  test.describe('Standard HTML <select> Element', () => {
    test('should select option by value', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      await dropdown.selectByValue('opt2');
      const selectedValue = await dropdown.getSelectedValue();

      expect(selectedValue).toBe('opt2');
    });

    test('should get selected label from <select>', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      await dropdown.selectByValue('opt1');
      const selectedLabel = await dropdown.getSelectedLabel();

      expect(selectedLabel).toBe('Option 1');
    });

    test('should detect visible select element', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      const isVisible = await dropdown.isVisible();
      expect(isVisible).toBe(true);
    });

    test('should get all options from <select>', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      const options = await dropdown.getAllOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.includes('Option 1'))).toBe(true);
    });

    test('should get option count', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      const count = await dropdown.getOptionCount();
      expect(count).toBeGreaterThan(0);
    });

    test('should check if option exists', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      const hasOption1 = await dropdown.hasOption('Option 1');
      const hasNonExistent = await dropdown.hasOption('Non Existent');

      expect(hasOption1).toBe(true);
      expect(hasNonExistent).toBe(false);
    });

    test('should detect enabled <select>', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      const isEnabled = await dropdown.isEnabled();
      expect(isEnabled).toBe(true);
    });

    test('should select multiple options in sequence', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      await dropdown.selectByValue('opt1');
      expect(await dropdown.getSelectedValue()).toBe('opt1');

      await dropdown.selectByValue('opt2');
      expect(await dropdown.getSelectedValue()).toBe('opt2');

      await dropdown.selectByValue('opt3');
      expect(await dropdown.getSelectedValue()).toBe('opt3');
    });
  });

  test.describe('Custom Dropdown Implementation', () => {
    test('should open and close custom dropdown', async () => {
      const dropdownLocator = page.locator('#custom-dropdown');
      const dropdown = new SelectDropdown(dropdownLocator, page);
      
      await dropdown.open();
      await expect(dropdownLocator).toHaveClass(/open/);
      await dropdown.close();
      await expect(dropdownLocator).not.toHaveClass(/open/);
    });

    test('should select option by label in custom dropdown', async () => {
      const dropdownLocator = page.locator('#custom-dropdown');
      const dropdown = new SelectDropdown(dropdownLocator, page);

      await dropdown.selectByLabel('Custom Option 1');

      const selectedText = await page.locator('#selected-text').textContent();
      expect(selectedText).toBe('Custom Option 1');
    });

    test('should select different options in sequence', async () => {
      const dropdownLocator = page.locator('#custom-dropdown');
      const dropdown = new SelectDropdown(dropdownLocator, page);

      await dropdown.selectByLabel('Custom Option 1');
      let selectedText = await page.locator('#selected-text').textContent();
      expect(selectedText).toBe('Custom Option 1');

      await dropdown.selectByLabel('Custom Option 2');
      selectedText = await page.locator('#selected-text').textContent();
      expect(selectedText).toBe('Custom Option 2');

      await dropdown.selectByLabel('Custom Option 3');
      selectedText = await page.locator('#selected-text').textContent();
      expect(selectedText).toBe('Custom Option 3');
    });

    test('should detect visible custom dropdown', async () => {
      const dropdownLocator = page.locator('#custom-dropdown');
      const dropdown = new SelectDropdown(dropdownLocator, page);

      const isVisible = await dropdown.isVisible();
      expect(isVisible).toBe(true);
    });

    test('should handle invalid option label gracefully', async () => {
      const dropdownLocator = page.locator('#custom-dropdown');
      const dropdown = new SelectDropdown(dropdownLocator, page);

      await expect(dropdown.selectByLabel('Non Existent Option')).rejects.toThrow();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent dropdown element', async () => {
      const dropdownLocator = page.locator('#non-existent');
      const dropdown = new SelectDropdown(dropdownLocator, page);

      await expect(dropdown.open(1000)).rejects.toThrow();
    });

    test('should throw when selecting non-existent value', async () => {
      const selectLocator = page.locator('#standard-select');
      const dropdown = new SelectDropdown(selectLocator, page);

      await expect(dropdown.selectByValue('non-existent')).rejects.toThrow();
    });
  });
});
