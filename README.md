# Dental CRM Test Suite


# Viewing Reports

**To generate and open the report immediately in your browser:**
- npm run allure:serve
- allure serve ./allure-results

**jq**
- Basic pretty print ``jq . file.json``
- ``cat input.json     | jq .``

# Example how to use: 
- grep -rl "M2.88001" allure-results/ | xargs jq .

## Playwright
- npx playwright test --last-failed
- npx playwright test --last-failed --headed --trace on    