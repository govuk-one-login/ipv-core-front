# ipv-core-front

This repository contains the source code for the frontend user interface of the GOV.UK One Login Identity Proofing and Verification (IPV) system.
The IPV Core frontend is the first user-facing screen in the identity proving journey.

## How it works

ipv-core-front is an Express app written in TypeScript. It uses Nunjucks for page templates, i18next for English/Welsh translations, and SASS for stylesheets. Pages follow the [GOV.UK Design System](https://design-system.service.gov.uk/), with the components and styling being provided by the [govuk-one-login-frontend](https://github.com/govuk-one-login/govuk-one-login-frontend/tree/main) project.

The app displays pages to users and sends their actions to [core-back](https://github.com/govuk-one-login/ipv-core-back), which contains the business logic and decides what page to show next.

## Related repositories

ipv-core-front works with the following IPV Core repositories:

* [ipv-core-back](https://github.com/govuk-one-login/ipv-core-back) - backend code
* [ipv-core-tests](https://github.com/govuk-one-login/ipv-core-tests) - feature tests
* [ipv-core-common-infra](https://github.com/govuk-one-login/ipv-core-common-infra) - utilities that automate IPV Core ancillary services
* [ipv-stubs](https://github.com/govuk-one-login/ipv-stubs) - test stubs for IPV Core dependencies (orchestration and credential issuers)

## Kiro
Kiro is Amazon's coding assistant AI, currently, as part of the AI experiment, we are allowed to use the command line version `kiro-cli`. This project includes a `.kiro` folder that contains markdown files designed
to give Kiro high level context about the project to help it make suggestions that work with the existing design decisions. This folder is committed so that all developers on the team can improve and benefit from
the steering information (https://kiro.dev/docs/cli/steering/).

# Developing ipv-core-front

This guide explains how to:

* [clone the repo and install the dependencies](#cloning-and-installing-ipv-core-front)
* [run ipv-core-front locally](#running-ipv-core-front-locally)
* [use pre-commit to verify your commits](#git-hooks)
* [create a new page](views/README.md)

## Pre-requisites

- Membership of the `govuk-one-login` GitHub organisation (needed for npm package access)
- Node.js — install the same version specified in the Dockerfile (currently 24.16). [nvm](https://github.com/nvm-sh/nvm) is recommended to manage Node versions, but any method is fine.

## Cloning and installing ipv-core-front

1. Clone this repository to your local machine:

```
git clone https://github.com/govuk-one-login/ipv-core-front.git
```

1. Change into the `ipv-core-front` folder.
1. [Create a GitHub personal access token](https://github.com/settings/tokens) with package:read scope
1. Copy `.npmrc.template` to `.npmrc` and replace `TOKEN_WITH_READ_PACKAGE_PERMISSION` with your personal access token
1. Run the following command to install the project dependencies:

```bash
npm ci
```

## Dependencies on govuk-one-login-frontend

We import common components, functions and middleware from the [govuk-one-login-frontend repository](https://github.com/govuk-one-login/govuk-one-login-frontend/tree/main)
such as the spinner component, language middleware and our base nunjucks template which is extended by all of Core's pages.

We also depend on and import [frontend-analytics](https://www.npmjs.com/package/@govuk-one-login/frontend-analytics) so that it can be used by our base page template.

Note: the base template in the above repo depends on nunjucks filters that are defined in this repository. When updating a filter,
consider if it affects the base nunjucks file and if the change will require multiple deployments to ensure backwards compatibility.

## Running ipv-core-front on a dev machine

### Local Running

The simplest way to run core-front locally is as part of core-back's [local running docker set-up](https://github.com/govuk-one-login/ipv-core-back/tree/main/local-running). This is the recommended approach for most development work.

You can attach a node debugger to localhost port 5001 to debug the core-front container.

### Running in an IDE

If you really need to run the code outside of docker

1. Create a `.env` file based on [`.env.sample`](https://github.com/govuk-one-login/ipv-core-front/blob/main/.env.sample).
   1. The default values should connect to a locally running core-back instance, you could also change the values to point to a dev environment running in AWS.
1. Run `npm run build`.
1. In your code editor, use a run configuration that starts [`src/app.ts`](https://github.com/govuk-one-login/ipv-core-front/blob/main/src/app.ts). Alternatively, you can run `npm run start-dev`.
1. To get live style updates, run `npm run watch-sass`.

Run `npm run build` again if changes are made to:
* the [govuk-frontend](https://github.com/alphagov/govuk-frontend) library
* translations
* images

## Automated tests

Unit tests can be run with `npm run test`.

Browser and snapshot tests are detailed in the [browser-tests readme](browser-tests/readme.md).

## Git hooks

This project uses two hook systems that run on `git commit`:

- **Husky + lint-staged** — runs code quality checks (eslint, prettier) on staged JS/TS files. Installed automatically by `npm ci`.
- **pre-commit** — runs infrastructure and security checks. Requires separate installation (see below).

### Husky + lint-staged

Husky is configured in `.husky/` and runs `lint-staged` on commit, which applies eslint and prettier to staged files. It also runs tests on `git push`.

No setup is needed — husky is installed automatically as part of `npm ci`.

### pre-commit

[pre-commit](https://pre-commit.com/) runs the following checks on commit (see [`.pre-commit-config.yaml`](.pre-commit-config.yaml) for full configuration):

- JSON formatting
- Trailing whitespace and end-of-file fixes
- AWS credential and private key detection
- CloudFormation linting (cfn-lint)
- Infrastructure scanning ([checkov](https://github.com/bridgecrewio/checkov))
- Secret detection ([detect-secrets](https://github.com/Yelp/detect-secrets))

#### Installing pre-commit

Using Homebrew (macOS):

```
brew install pre-commit cfn-lint checkov
```

Or using pip (all platforms):

```
pip3 install pre-commit cfn-lint checkov
```

Then configure the git hooks:

```
pre-commit install
```

#### Notes

- If pre-commit auto-fixes whitespace or end-of-file issues, just run `git commit` again.
- If detect-secrets flags a false positive, update the baseline: `detect-secrets scan > .secrets.baseline`

## GitHub tools and workflows

### GitHub CODEOWNERS

You can use a [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) file to define individuals or teams that are responsible for code in a repository. GitHub automatically requests reviews from these code owners when someone opens a pull request that modifies the code they own.

You can find the [`CODEOWNERS` file for ipv-core-front](https://github.com/govuk-one-login/ipv-core-front/blob/main/CODEOWNERS) in the root.
