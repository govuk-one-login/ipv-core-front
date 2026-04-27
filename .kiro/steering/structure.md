# Website
Code for the site is in the /src directory
Deployment configuration is found in /deploy/template.yaml
Translation text for i18next is in /locales/*/translation.json
GitHub workflows are used to configure build pipelines and run automated tests.

# Testing
Unit tests are kept alongside (or very close to) the files that they test.
Browser tests have their own folder and are for higher level tests of the entire site, and for snapshot tests
