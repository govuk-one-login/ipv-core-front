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

# Misc
Check package.json for the full list of packages used by the site.
Check README files for more information about the project.
