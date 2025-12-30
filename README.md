# ipv-core-front

This repository contains the source code for the frontend user interface of the GOV.UK One Login Identity Proofing and Verification (IPV) system.
The IPV Core frontend is the first user-facing screen in the identity proving journey.

## Related repositories

ipv-core-front works with the following IPV Core repositories:

* [ipv-core-back](https://github.com/govuk-one-login/ipv-core-back) - backend code
* [ipv-core-tests](https://github.com/govuk-one-login/ipv-core-tests) - feature tests
* [ipv-core-common-infra](https://github.com/govuk-one-login/ipv-core-common-infra) - utilities that automate IPV Core ancillary services
* [ipv-stubs](https://github.com/govuk-one-login/ipv-stubs) - test stubs for IPV Core dependencies (credential issuers)

# Developing ipv-core-front

This guide explains how to:

* [clone the repo and install the dependencies](#cloning-and-installing-ipv-core-front)
* [run ipv-core-front locally](#running-ipv-core-front-locally)
* [use pre-commit to verify your commits](#using-pre-commit-to-verify-your-commits)
* [creating a new page](views/README.md)

## Cloning and installing ipv-core-front

1. Clone this repository to your local machine:

```
https://github.com/govuk-one-login/ipv-core-front.git
```
1. Change into the `ipv-core-front` folder.
2. [Create a GitHub personal access token][create-pat] with package:read scope
3. Copy `.npmrc.template` to `.npmrc` and replace `TOKEN_WITH_READ_PACKAGE_PERMISSION` with your personal access token
4. Run the following command to install the project dependencies:

```bash
npm install
```

### Environment variables

This project uses the following environment variables:

| Variable name             | Description                                                                                                         | Default value                                                 |
|---------------------------|---------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| `API_BASE_URL`            | Specifies the base host of the backend API. It is used by the application to make requests to the backend services. | -                                                             |
| `CONTACT_URL`             | URL of the GOV.UK One Login contact form.                                                                           | [`https://home.account.gov.uk/contact-gov-uk-one-login`](https://home.account.gov.uk/contact-gov-uk-one-login) |
| `ENABLE_PREVIEW`          | Turns on the `dev/all-templates` route to preview individual pages.                                                 | `development`                                                 |
| `EXTERNAL_WEBSITE_HOST`   | Sets the default host used by the application.                                                                      | `http://localhost:                                            |
| `NODE_ENV`                | Specifies the environment where the application will run, for example `local`.                                      | -                                                             |
| `PORT`                    | Default port to run the web server on.                                                                              | `4501`                                                        |
| `SESSION_SECRET`          | The secret key used for encrypting and decrypting session data.                                                     | -                                                             |
| `LANGUAGE_TOGGLE`         | Active Language Toggle into all pages                                                                               | `false`                                                       |
| `USE_DEVICE_INTELLIGENCE` | Turn on device fingerprinting on all pages                                                                          | `false`                                                       |


## Running ipv-core-front locally

To run ipv-core-front locally in isolation:

1. Create a `.env` file based on [`.env.sample`](https://github.com/govuk-one-login/ipv-core-front/blob/main/.env.sample).
1. Run `npm run build`.
1. In your code editor, use a run configuration that starts [`src/app.ts`](https://github.com/govuk-one-login/ipv-core-front/blob/main/src/app.ts). Alternatively, you can run `npm run start-dev`.
1. To get live style updates, run `npm run watch-sass`.

Run `npm run build` again if changes are made to:
* the [govuk-frontend](https://github.com/alphagov/govuk-frontend) library
* translations
* images

### Automated tests

Tests can be run with `npm run test` but note that if you are using Node v22.18+, you will need to run `export NODE_OPTIONS="--no-experimental-strip-types"` first because of an incompatibility in our dependency 'proxyquire'.

### Running ipv-core-front locally with core-back and orch-stub

You can run a complete IPV Core setup by using the
[local-running setup in core-back](https://github.com/govuk-one-login/ipv-core-back/tree/main/local-running).

### Analytics
https://www.npmjs.com/package/@govuk-one-login/frontend-analytics

## Using pre-commit to verify your commits

We use the [pre-commit](https://pre-commit.com/) tool to identify issues before you commit your code. It uses Git hook scripts which you can configure in [`.pre-commit-config.yaml`](https://github.com/govuk-one-login/ipv-core-front/blob/main/.pre-commit-config.yaml).

On running `git commit`, pre-commit Git hooks check for:

- formatting issues in JSON files
- end of file issues
- trailing whitespaces
- AWS credentials or private keys you might have added by accident
- AWS CloudFormation issues
- infrastructure issues - by running [checkov](https://github.com/bridgecrewio/checkov)
- secrets you might have added by accident - by running [detect-secrets](https://github.com/Yelp/detect-secrets).

If any secrets detected are false positives, update the `.secrets.baseline` file by running `detect-secrets scan > .secrets.baseline`.

### Committing after automatic changes

Pre-commit automatically fixes end of file issues and trailing whitespaces. If this happens, run `git commit` again to commit the changes.

### Understanding issue outputs

If pre-commit detects an issue during a commit, it will produce an output similar to the following:

```
 git commit -a
check json...........................................(no files to check)Skipped
fix end of files.........................................................Passed
trim trailing whitespace.................................................Passed
detect aws credentials...................................................Passed
detect private key.......................................................Passed
AWS CloudFormation Linter................................................Failed
- hook id: cfn-python-lint
- exit code: 4
W3011 Both UpdateReplacePolicy and DeletionPolicy are needed to protect Resources/PublicHostedZone from deletion
core/deploy/dns-zones/template.yaml:20:3
Checkov..............................................(no files to check)Skipped
- hook id: checkov
```

### Installing the dependencies for pre-commit

To use pre-commit locally you need to install some dependencies, using either:

* [Python pip](https://pypi.org/project/pip/)
* [Homebrew](https://brew.sh/)

#### Using Python pip

Run the following:

```
sudo -H pip3 install checkov pre-commit cfn-lint
```

This should work across all platforms.

#### Using Homebrew

Run the following:

```
brew install pre-commit ;\
brew install cfn-lint ;\
brew install checkov
```

#### Configuring pre-commit

Once installed, run:

```
pre-commit install
```

Update the pre-commit plugins by running:

```
pre-commit autoupdate && pre-commit install
```

This command will install and configure the pre-commit Git hooks.

## GitHub tools and workflows

### GitHub CODEOWNERS

You can use a [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) file to define individuals or teams that are responsible for code in a repository. GitHub automatically requests reviews from these code owners when someone opens a pull request that modifies the code they own.

You can find the [`CODEOWNERS` file for ipv-core-front](https://github.com/govuk-one-login/ipv-core-front/blob/main/CODEOWNERS) in the root.
