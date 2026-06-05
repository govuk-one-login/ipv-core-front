# Website
The `core-front` website uses the Express webserver. The site is written in TypeScript and Nunjucks is used the templating language for the web pages.
i18next is used for handling translations
The site runs in AWS ECS.
The site uses DynamoDb for data storage.
Configuration is stored in environment variables accessed through dotenv, or in AWS SSM.
csrf-sync is used to provide csrf protection for the forms on the site.
Axios is used to send web requests (e.g. to `core-back`)
The base template for `core-front` is actually stored in the `@govuk-one-login/frontend-ui`
CSS is generated using SASS

# Testing
Unit tests use Mocaha, Sinon, and Chai.
Browser tests have their own folder and use PlayWright

# Page conventions
When creating new pages:
- Use curly quotes (\u2018 \u2019) not straight quotes (') in translation text. Use the actual characters, not unicode escape sequences (\u2018, \u2019).
- Use GOV.UK Design System macros (govukDetails, govukInsetText, govukRadios, etc.) rather than writing raw HTML for components.
- Nunjucks tags should have a space before the closing `%}`, e.g. `{% set contentID = 'abc' %}` not `{% set contentID = 'abc'%}`.
- When a page has a hardcoded link to its own journey action, use the page name directly (e.g. `/ipv/journey/my-page/anotherWay`) rather than `{{ pageId }}`.
- When creating a new page, also add entries to: `src/constants/ipv-pages.ts`, `src/test-utils/pages-and-contexts.ts`, and both `locales/en/translation.json` and `locales/cy/translation.json`. See `views/README.md` for the full checklist.

# Context-aware translations
When a page uses `pageContext` to vary its content, the translation key naming works as follows:
- The context type is defined as a boolean in `src/types/page-contexts.ts`, e.g. `{ photoId: boolean }`.
- `getPageContextValue` in `src/config/nunjucks.ts` converts boolean `true` to PascalCase of the context key name (e.g. `photoId` → `"PhotoId"`). `false` returns `""` (uses base key).
- The context suffix is appended directly to the base key name to form the variant key.
- Example: for context key `photoId` with value `true`, base key `header` resolves to `headerPhotoId`.
- The base key (e.g. `header`) is the fallback when context is missing or false.
- In the template, use `| translateWithPageContextOrFallback(pageContext, 'photoId')` for content and `| fullKeyWithContext(pageContext, 'photoId')` for `pageTitleKey`.
- In `pages-and-contexts.ts`, register variants like: `{ photoId: { photoId: true } }, NO_CONTEXT_VARIANT`.
- Dynamic pages must set `{% set isPageDynamic = true %}` for analytics.
- Dynamic pages should have a different `contentID` for each context variant. If someone requests a dynamic page without providing multiple contentID values, ask them for the additional values.

# Misc
Check package.json for the full list of packages used by the site.
Check README files for more information about the project.
