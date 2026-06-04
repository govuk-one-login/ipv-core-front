# Pages

Our pages are defined in nunjucks template files, mostly under `views/ipv/page`. We also have some shared components under `views/components`.

Page templates extend `views/shared/base.njk`, which itself extends `build/components/bases/ipv-core/ipv-core-base.njk` from the `@govuk-one-login/frontend-ui` package. This means some variables (like language toggle, analytics) are handled by the upstream base template.

## Template data

Data for the templates comes from a number of sources:
1. `renderOptions` provides dynamic variables, which may be different for each render:
    - `pageContext`
        - Object containing context data for the page.
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

## How the data is accessed

1. `renderOptions`:
    - Variables here can be referenced in Nunjucks like `"{{pageId}}"` or `"{{csrfToken}}""`.
2. English/ Welsh content:
    - These values are referenced in the template in single quotation marks, e.g.:
    ```
    {% set errorTitle = 'pages.pageMultipleDocCheck.content.formErrorMessage.errorSummaryTitleText' | translate %}
    ```
    - `translate` & variants are defined in `src/config/nunjucks.ts`.
        - `translate` takes the reference as a key to find the content saved in `locales` files for english/ welsh.
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

## Page contexts

Some pages need to display different content depending on context (e.g. the same page template shows slightly different text depending on how the user arrived). This is handled via `pageContext` — an object passed in `renderOptions` that contains context values.

Pages that use page context values to change what they display are referred to as dynamic pages. Most pages don't use page context values and are referred to as static pages.

Page context values can be used to access different translation text with e.g. `translateWithPageContext` or to directly alter parts of the page:

```
{% if pageContext.reason == "dropout" %}
    {% set contentID = '5ed297db-68a9-4915-aaf1-6473b29d0965' %}
{% else %}
    {% set contentID = '562a0ebb-34a0-4db1-b04c-17963686c98c' %}
{% endif %}
```

## Rendering a page

- Nunjucks files are rendered by the Express app.
- The Express handler returns the result of `res.render(<path to template>, renderOptions)`.
- Requests are routed in `src/app/ipv/router.ts` with generic route handlers.

1. GET requests at `/page/:pageId` will be automatically handled with:
   ```typescript
   router.get(getPagePath(":pageId"), csrfSynchronisedProtection, handleJourneyPageRequest);
   ```
1. POST requests, with:
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

Note: Some pages have special-case routes defined before the generic handler (e.g. `PYI_ATTEMPT_RECOVERY`, `UPDATE_DETAILS`, `CONFIRM_DETAILS`). Check `src/app/ipv/router.ts` for the full list.

## Anatomy of a page

Using `prove-identity-no-photo-id` as an example:

- Inherit from the base template - it contains the common stylesheets and layout.
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

- Set the page title using English/ Welsh content.
    ```html
    {% set pageTitleKey = 'pages.proveIdentityNoPhotoId.title' | fullKeyWithContext(pageContext, 'ninoOnly') %}
    ```
    - `fullKeyWithContext` appends a context suffix to the translation key, allowing different title text depending on the page context. Most pages don't need this — a simple `{% set pageTitleKey = 'pages.myPage.title' %}` is usually sufficient. Only use `fullKeyWithContext` if the page title needs to vary based on context.

- Set the back link (if the page should have one).
    ```html
    {% set showBack = true %}
    {% set hrefBack = "/ipv/journey/prove-identity-no-photo-id/back" %}
    ```

- Set the tag for analytics.
    ```html
    {% set googleTagManagerPageId = "proveIdentityNoPhotoId" %}
    ```

- Set whether the page contains sensitive data (for analytics).
    ```html
    {% set isPageDataSensitive = false %}
    ```

- Set the content ID for content management.
    ```html
    {% set contentID = '8fe1817a-07f6-48a5-bd53-ebc92cb1629b'%}
    ```

- Variables for indicating errors, used in shared/base.njk as well.
    ```html
    {% set errorState = pageErrorState %}
    {% set errorTitle = 'pages.proveIdentityNoPhotoId.content.formErrorMessage.errorSummaryTitleText' | translate %}
    {% set errorText = 'pages.proveIdentityNoPhotoId.content.formErrorMessage.errorSummaryDescriptionText' | translateWithPageContextOrFallback(pageContext, 'ninoOnly') %}
    {% set errorHref = "#proveIdentityNoPhotoIdOptionsForm" %}
    ```
    - `errorHref` should reference the form's id, so it hash-links there.

- The form which POSTs to the same URL as the page.
    ```html
    <form id="proveIdentityNoPhotoIdOptionsForm" action="/ipv/page/{{ pageId }}" method="POST">
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
        {% set errorMessageObject = { 'text': 'pages.proveIdentityNoPhotoId.content.formErrorMessage.errorRadioMessage' | translateWithPageContextOrFallback(pageContext, 'ninoOnly') } %}
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


## Creating a new page

1. Add a Nunjucks template in `views/ipv/page`, e.g. `prove-identity-no-photo-id`
   If you can see an existing page with a similar structure then take a copy of that page as a starting point.

1. **[ipv-pages.ts](../src/constants/ipv-pages.ts)** - Add a new entry to the `IPV_PAGES` object with a constant name and the page slug (matching the Nunjucks template filename), e.g.:
   ```typescript
   MY_NEW_PAGE: "my-new-page",
   ```

1. **[page-contexts.ts](../src/types/page-contexts.ts)** - If your page uses a `pageContext` (for context-aware translations), add an entry to the `PageContextMap` type with the page slug and its context shape, e.g.:
   ```typescript
   "my-new-page": { someContextValue: string };
   ```
   If your page does not use page contexts, you can skip this file.

1. **[pages-and-contexts.ts](../src/test-utils/pages-and-contexts.ts)** - Add an entry to the `pagesAndContexts` object for your page. This is used by tests to verify pages render correctly with each context variant:
   - If your page has no contexts: `"my-new-page": [],`
   - If your page has contexts, list the variants:
     ```typescript
     "my-new-page": [
       { variantName: { someContextValue: "value" } },
       NO_CONTEXT_VARIANT,
     ],
     ```

1. **Translations** - Add the page's content (title, body text, error messages, etc.) to both locale files:
   - `locales/en/translation.json` (English)
   - `locales/cy/translation.json` (Welsh)

   Under the `pages` key, using the page's camelCase name, e.g. `pages.myNewPage.title`.

   If we only have English text then use it in both the Welsh and English files and then run the `check-translations` script to generate a JSON segment of untranslated text that we can send to the UCD team for translation. The script will also produce an array of untranslated text entries that should be added to `UNTRANSLATED_WHITELIST` until we get the translations back.

1. **Router (if needed)** - Most pages are handled by the generic route handlers in `src/app/ipv/router.ts` and don't need explicit routes. However, if your page requires special handling (custom middleware, different form validation, etc.), add a specific route before the generic handlers in the router. Check the existing special-case routes for examples.
1. Rebuild and run the [snapshot tests](../browser-tests/readme.md) to generate new snapshots for the new pages.

## Notes

- When adding in a feature, check if a specific govUk component exists before styling a generic tag.
- When updating a journey map to use the page it must produce consistent events, for a certain `context`, across the journey maps. This is enforced with unit tests.
- [Nunjucks docs](https://mozilla.github.io/nunjucks/)
- [Design System docs](https://design-system.service.gov.uk/)
- [Design System components](https://design-system.service.gov.uk/components/)
