# Pages

Updated: 01/08/2024

## How they work

### Rendering

#### Intro

- Nunjucks files are templates which are rendered by the Express app.
- The Express handler returns the `res.render(<path to template>, renderOptions)`.
- Requests are routed in `app/ipv/router.js` with generic route handlers.

#### Hydrating the template

From a number of sources:
1. `renderOptions` provides dynamic variables, which may be different for each render:
   - `context`
     - General input indicating the need for different content.
   - `pageId`
     - The id of the page itself so the page form posts to the same URL.
   - `csrfToken`
     - Token passed into hidden input on page to be submitted with the rest of the form data.
   - (optional params)
     - `userDetails`
       - User information, for the appropriate screens
     - `qrCode`
       - QR code to download the mobile doc checking app, dynamically input because can be IOS/ Android.
     - `appDownloadUrl`
       - Link to download the mobile doc checking app.
     - `pageErrorState`
       - Boolean indicating a form validating error on that page.
     - `errorState`
       - String indicating type of form error (`checkbox`/ `radiobox`).
2. English/ Welsh content in `src/locales`.
3. The `res.locals` variable set in `localesjs`.

#### How the data is accessed

1. `renderOptions`:
   - Variables here can be referenced in Nunjucks like `"{{contactUsUrl}}"`.
2. English/ Welsh content:
   - These values are referenced in the template in single quotation marks, e.g.:
    ```
    {% set errorTitle = 'pages.pageMultipleDocCheck.content.formErrorMessage.errorSummaryTitleText' | translate %}
    ```
   - `translate` & variants are defined in `src/config/nunjucks.js`.
     - It takes the reference as a key to find the content saved in `src/locales` files for english/ welsh.
     - It can take secondary params, e.g.: `context`, which adds a suffix to the reference it's going to find.
3. `locals.js`:
    - the `res.locals` variable attributes are provided as variables in the Nunjucks file, to be accessible like `"{{contactUsUrl}}"`.

## Creating a new page

Assuming this page wants a radio input on it

1. Add a Nunjucks template in `src/views/ipv/page`, e.g. `prove-identity-no-other-photo-id`

Breaking this example down:
- Needed as contains the common stylesheets, layout.
    ```html
    {% extends "shared/base.njk" %}
    ```
  - Relevant details:
    - `pageTitleKey` is used for finding title from content, and `pageErrorState` may trigger an "Error: " prefix.
    `showLanguageToggle` toggles the language toggle.
    - `showBack` toggles the back link.
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
  - `req.csrfToken()` creates the token in the GET route handler
  - The result is saved in here
  - And `csrfProtection()` checks it, in the POST route handler.

- Variable with the config for the govukRadios component. Represents key value pair where key is "journey".
    ```html
    {% set radiosConfig = {...} %}
    ```
  - The values given to the radio map directly with the event the state associated will produce, so keep to camelCase.

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
    - The `contactUsUrl` is created in `locals.js` to include the `fromUrl` query.
    - The link attributes are a blanket policy of GDS

2. GET requests at `/page/:pageId` will be automatically handled with:
   ```javascript
   router.get(getPagePath(":pageId"), csrfProtection, handleJourneyPage);
   ```
3. POST requests, with:
    ```javascript
    router.post(
        getPagePath(":pageId"),
        parseForm,
        csrfProtection,
        formRadioButtonChecked,
        handleJourneyAction,
    );
    ```

### Notes

- When adding in a feature, check if a specific govUk component exists before styling a generic tag.
- When updating a journey map to use the page it must produce consistent events, for a certain `context`, across the journey maps. This is enforced with unit tests.
- Nunjucks docs: https://mozilla.github.io/nunjucks/
- Design System docs: https://design-system.service.gov.uk/
- Design System components (standard gov uk): https://design-system.service.gov.uk/components/
