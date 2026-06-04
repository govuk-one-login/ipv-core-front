# Pages

Updated: 27/05/2026

## How they work

### Rendering

#### Intro

- Nunjucks files are templates which are rendered by the Express app.
- The Express handler returns the result of `res.render(<path to template>, renderOptions)`.
- Requests are routed in `src/app/ipv/router.ts` with generic route handlers.

#### Hydrating the template

Data for the template comes from a number of sources:
1. `renderOptions` provides dynamic variables, which may be different for each render:
   - `pageContext`
     - Object containing context data for the page, used with context-aware translation filters.
   - `pageId`
     - The id of the page itself so the page form posts to the same URL.
   - `csrfToken`
     - Token passed into hidden input on page to be submitted with the rest of the form data.
   - (optional params)
     - `userDetails`
       - User information, for the appropriate screens.
     - `qrCode`
       - QR code to download the mobile doc checking app, dynamically input because can be IOS/ Android.
     - `appDownloadUrl`
       - Link to download the mobile doc checking app.
     - `pageErrorState`
       - Boolean indicating a form validation error on that page.
     - `errorState`
       - String indicating type of form error (`checkbox`/ `radiobox`).
     - `apiUrl`
       - URL for spinner pages to poll for VC receipt status.
     - `msBetweenRequests`
       - Milliseconds between polling requests (spinner pages).
     - `msBeforeInformingOfLongWait`
       - Milliseconds before showing a long wait message (spinner pages).
     - `msBeforeAbort`
       - Milliseconds before aborting the spinner (spinner pages).
     - `postOfficeVisitByDate`
       - Date by which the user should visit the post office.
     - `documentExpiryDate`
       - Date threshold for document expiry grace period.
2. English/ Welsh content in `locales`.
3. The `res.locals` variable set in `src/lib/locals.ts`.

#### How the data is accessed

1. `renderOptions`:
   - Variables here can be referenced in Nunjucks like `"{{contactUsUrl}}"`.
2. English/ Welsh content:
   - These values are referenced in the template in single quotation marks, e.g.:
    ```
    {% set errorTitle = 'pages.pageMultipleDocCheck.content.formErrorMessage.errorSummaryTitleText' | translate %}
    ```
   - `translate` & variants are defined in `src/config/nunjucks.ts`.
     - It takes the reference as a key to find the content saved in `locales` files for english/ welsh.
   - Additional translation filters:
     - `translateToEnglish` - always translates to English regardless of current language.
     - `translateWithPageContext(pageContext, contextKey)` - translates using a context value from the pageContext object. Throws an error if the context key doesn't exist.
     - `translateWithPageContextOrFallback(pageContext, contextKey)` - translates using a context value, falling back to the base translation if the context key doesn't exist.
     - `fullKeyWithContext(pageContext, contextKey)` - returns the full translation key with context suffix appended - used to pass the translation key of the title to base page template.
   - Other useful filters:
     - `setAttribute(key, value)` - adds an attribute to an object (used for conditional error messages).
     - `GDSDate` - formats a date in GDS style (e.g. "1 January 2025"), respecting the current language.
     - `DateDayAndMonth` - formats a date showing only day and month.
     - `jsonToList` - converts a JSON string to an HTML list.
3. `src/lib/locals.ts`:
    - the `res.locals` variable attributes are provided as variables in the Nunjucks file, to be accessible like `"{{contactUsUrl}}"`.

#### Template inheritance

Templates extend `shared/base.njk`, which itself extends `build/components/bases/ipv-core/ipv-core-base.njk` from the `@govuk-one-login/frontend-ui` package. This means some variables (like language toggle, analytics) are handled by the upstream base template.

## Creating a new page

Assuming this page wants a radio input on it

1. Add a Nunjucks template in `views/ipv/page`, e.g. `prove-identity-no-other-photo-id`

Breaking this example down:
- Needed as contains the common stylesheets, layout.
    ```html
    {% extends "shared/base.njk" %}
    ```
  - Relevant details:
    - `pageTitleKey` is used for finding title from content, and `pageErrorState` may trigger an "Error: " prefix.
    - `showBack` toggles the back link.
    - `hrefBack` the URL for the back link. Usually just the current page with `/back` appended.
    - `errorState` toggles error summary, which includes: `errorTitle`, `errorText` and `errorHref`.
    - `googleTagManagerPageId` sets state.

- Import common, standard GovUK components if they are needed.
    ```html
    {% from "govuk/components/button/macro.njk" import govukButton %}
    {% from "govuk/components/radios/macro.njk" import govukRadios %}
    ```

- Sets the page title using English/ Welsh content.
    ```html
    {% set pageTitleKey = 'pages.proveIdentityNoOtherPhotoId.title' %}
    ```

- Sets the tag for analytics.
    ```html
    {% set googleTagManagerPageId = "proveIdentityNoOtherPhotoId" %}
    ```

- Sets whether the page contains sensitive data (for analytics).
    ```html
    {% set isPageDataSensitive = false %}
    ```

- Sets the content ID for content management.
    ```html
    {% set contentID = 'a6aab77d-1781-4777-a524-ef78925aa6a2'%}
    ```

- Variables for indicating errors, used in shared/base.njk as well.
    ```html
    {% set errorState = pageErrorState %}
    {% set errorTitle = 'pages.proveIdentityNoOtherPhotoId.content.formErrorMessage.errorSummaryTitleText' | translate %}
    {% set errorText = 'pages.proveIdentityNoOtherPhotoId.content.formErrorMessage.errorSummaryDescriptionText' | translate %}
    {% set errorHref = "#proveIdentityNoOtherPhotoIdForm" %}
    ```
  - `errorHref` should reference the form's id, so it hash-links there.

- The form which POSTs to the same URL as the page.
    ```html
    <form id="proveIdentityNoOtherPhotoIdForm" action="/ipv/page/{{ pageId }}" method="POST">
    ```

- Hidden input for carrying the token from the GET request to the POST request.
    ```html
    <input type="hidden" name="_csrf" value="{{ csrfToken }}">
    ```
  - `req.csrfToken?.(true)` creates the token in the GET route handler (the parameter forces a new token for each request).
  - The result is passed as `csrfToken` in the renderOptions.
  - `csrfSynchronisedProtection` middleware (from `csrf-sync`) validates the token in the POST route handler.

- Variable with the config for the govukRadios component.
    ```html
    {% set radiosConfig = {...} %}
    ```
  - The values given to the radio config map directly to the events that page will produce, and must match the events in the associated journey map state (in core-back), so keep to camelCase.

- This is the conditionally-visible error message within the form.
    ```html
    {% if errorState %}
        {% set errorMessageObject = { 'text': 'pages.proveIdentityNoOtherPhotoId.content.formErrorMessage.errorRadioMessage' | translate } %}
        {% set radiosConfig = radiosConfig | setAttribute('errorMessage', errorMessageObject) %}
    {% endif %}
    ```

- We populate standard govUk components here.
    ```html
    {{ govukRadios(radiosConfig) }}
    {{ govukButton({
        id: "submitButton",
        text: 'general.buttons.next' | translate
    }) }}
    ```

- This is a (relatively) common link we have at the end of the page.
    ```html
    {% include "components/contact-us-link.njk" %}
    ```
    - The `contactUsUrl` is created in `src/lib/locals.ts` to include the `fromUrl` query.
    - The link attributes are a blanket policy of GDS

2. GET requests at `/page/:pageId` will be automatically handled with:
   ```typescript
   router.get(getPagePath(":pageId"), csrfSynchronisedProtection, handleJourneyPageRequest);
   ```
3. POST requests, with:
    ```typescript
    router.post(
        getPagePath(":pageId"),
        validatePageId,
        csrfSynchronisedProtection,
        parseForm,
        checkFormRadioButtonSelected,
        handleJourneyActionRequest,
    );
    ```

   Note: Some pages have special-case routes defined before the generic handler (e.g. `UPDATE_DETAILS`, `CONFIRM_DETAILS`, `CHECK_MOBILE_APP_RESULT`, `PYI_TRIAGE_DESKTOP_DOWNLOAD_APP`, `PROBLEM_DIFFERENT_BROWSER`). Check `src/app/ipv/router.ts` for the full list.

### Add new page to constants:

When adding new pages make sure they are also added to the required constants:

1. **[ipv-pages.ts](../src/constants/ipv-pages.ts)** - Add a new entry to the `IPV_PAGES` object with a constant name and the page slug (matching the Nunjucks template filename), e.g.:
   ```typescript
   MY_NEW_PAGE: "my-new-page",
   ```

2. **[page-contexts.ts](../src/types/page-contexts.ts)** - If your page uses a `pageContext` (for context-aware translations), add an entry to the `PageContextMap` type with the page slug and its context shape, e.g.:
   ```typescript
   "my-new-page": { someContextValue: string };
   ```
   If your page does not use page contexts, you can skip this file.

3. **[pages-and-contexts.ts](../src/test-utils/pages-and-contexts.ts)** - Add an entry to the `pagesAndContexts` object for your page. This is used by tests to verify pages render correctly with each context variant:
   - If your page has no contexts: `"my-new-page": [],`
   - If your page has contexts, list the variants:
     ```typescript
     "my-new-page": [
       { variantName: { someContextValue: "value" } },
       NO_CONTEXT_VARIANT,
     ],
     ```

4. **Translations** - Add the page's content (title, body text, error messages, etc.) to both locale files:
   - `locales/en/translation.json` (English)
   - `locales/cy/translation.json` (Welsh)

   Under the `pages` key, using the page's camelCase name, e.g. `pages.myNewPage.title`.

   If we only have English text then use it in both the Welsh and English files and then run the `check-translations` script to generate a JSON segment of untranslated text that we can send to the UCD team for translation. The script will also produce an array of untranslated text entries that should be added to `UNTRANSLATED_WHITELIST` until we get the translations back.

5. **Router (if needed)** - Most pages are handled by the generic route handlers in `src/app/ipv/router.ts` and don't need explicit routes. However, if your page requires special handling (custom middleware, different form validation, etc.), add a specific route before the generic handlers in the router. Check the existing special-case routes for examples.

6. Rebuild and run the [snapshot tests](../browser-tests/readme.md) to generate new snapshots for the new pages.

### Notes

- When adding in a feature, check if a specific govUk component exists before styling a generic tag.
- When updating a journey map to use the page it must produce consistent events, for a certain `context`, across the journey maps. This is enforced with unit tests.
- Nunjucks docs: https://mozilla.github.io/nunjucks/
- Design System docs: https://design-system.service.gov.uk/
- Design System components (standard gov uk): https://design-system.service.gov.uk/components/
