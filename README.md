# ipv-core-front

This repository contains the source code for the frontend user interface of the GOV.UK One Login Identity Proofing and Verification (IPV) system. The IPV Core frontend serves as the first user-facing screen within the identity proving journey.

## Related repositories

ipv-core-front works with the following IPV Core repositories:

* [ipv-core-back](https://github.com/govuk-one-login/ipv-core-back) - backend code
* [ipv-core-tests](https://github.com/govuk-one-login/ipv-core-tests) - feature tests
* [ipv-core-common-infra](https://github.com/govuk-one-login/ipv-core-common-infra) - utilities for automating IPV Core ancillary services
* [ipv-stubs](https://github.com/govuk-one-login/ipv-stubs) - stubs for IPV Core dependencies (credential issuers)

# Developing ipv-core-front

This guide explains how to:

* clone the repo and install the dependencies
* run ipv-core-front locally
* use pre-commit to verify your commits

## Installing ipv-core-front

1. Clone this repository to your local machine:

```
https://github.com/govuk-one-login/ipv-core-front.git
```

2. Run the following command to install the project dependencies:

```bash
npm install
```

### Environment variables

The following environment variables are used in the project:

| Variable Name             | Description                                              | Default Value  |
|---------------------------|----------------------------------------------------------|----------------|
| `BASE_URL`                | Externally accessible base URL of the webserver. Used to generate callback URLs for the credential issuer OAuth (Open Authorization) flows. | -         |
| `API_BASE_URL`            | Specifies the base host of the backend API. It is used by the application to make requests to the backend services.                         | -         |
| `PORT`                    | Default port to run the webserver on.                    | `3000`         |
| `EXTERNAL_WEBSITE_HOST`   | Sets the default host used by the application.                                                         |   `http://localhost:8080`                   |
| `NODE_ENV`                | Specifies the environment where the application will run, for example `local`.                                                   |             -        |
| `SESSION_SECRET`          | The secret key required for encrypting and decrypting session data.                                                       |             -         |


## Running ipv-core-front locally

To run ipv-core-front locally:

1. Create a `.env` file based on [`.env.sample`](https://github.com/govuk-one-login/ipv-core-front/blob/main/.env.sample).
1. Run `npm run build`.
1. In your code editor, use a run configuration that starts [`src/app.js`](https://github.com/govuk-one-login/ipv-core-front/blob/main/src/app.js). Alternatively, you can run `npm run start-dev`.
1. To get live updating of styles, run `npm run watch-sass`.

You will need to run `npm run build` again if changes are made to:
* the [govuk-frontend](https://github.com/alphagov/govuk-frontend) library
* translations
* images

### Configuring core-back to work with a local core-front

You can use the [dev-deploy tool](https://github.com/govuk-one-login/ipv-core-common-infra/blob/main/utils/dev-deploy/README.md) to [configure your core-back to work with a local core-front](https://github.com/govuk-one-login/ipv-core-common-infra/blob/main/utils/dev-deploy/docs/local-development.md#configuring-core-back-to-work-with-a-local-core-front).

## Using pre-commit to verify your commits

We use the [pre-commit](https://pre-commit.com/) tool to identify issues before you commit your code. It uses Git hook scripts which can be configured in [`.pre-commit-config.yaml`](https://github.com/govuk-one-login/ipv-core-front/blob/main/.pre-commit-config.yaml).

On running `git commit`, pre-commit Git hooks check for:

- formatting issues in JSON files
- end of file issues
- trailing whitespaces
- AWS credentials or private keys that have been accidentally added
- AWS CloudFormation issues
- infrastructure issues by running [checkov](https://github.com/bridgecrewio/checkov) 
- secrets that have been accidentally added by running [detect-secrets](https://github.com/Yelp/detect-secrets) - if these are false positives, update the `.secrets.baseline` file by running `detect-secrets scan > .secrets.baseline`

### Committing after automatic changes

End of file issues and trailing whitespaces are automatically fixed. If this happens, run `git commit` again to commit the changes.

### Understanding issue outputs

If an issue is detected while committing, pre-commit will produce an output similar to the following:

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

To use pre-commit locally you will need to install some dependencies, this can be done in 2 ways:

* [Python pip](https://pypi.org/project/pip/)
* [Homebrew](https://brew.sh/)

#### Using Python pip

Run the following:

```
sudo -H pip3 install checkov pre-commit cfn-lint
```

This should work across platforms.

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

This will install and configure the pre-commit Git hooks. 

## GitHub tools and workflows

### GitHub CODEOWNERS

You can use a [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) file to define individuals or teams that are responsible for code in a repository. Code owners are automatically requested for review when someone opens a pull request that modifies code that they own.

You can find the [`CODEOWNERS` file for ipv-core-front](https://github.com/govuk-one-login/ipv-core-front/blob/main/CODEOWNERS) in the root.

### Uploading assets to Amazon CloudFront

If you add a new MIME type to either the `/assets` or `/public` folders, you must also add it to the CloudFront function in that repository.

This is because there is a step in the `secure-post-merge.yml` GitHub workflow that pushes a ZIP archive of the `/public` and `/assets` folders to an Amazon S3 bucket. Following this, the archive is decompressed and transferred to a separate bucket situated behind a CloudFront distribution. The infrastructure for this is hosted at [https://github.com/alphagov/di-ipv-core-common-infra/tree/main/cloudformation/upload-assets](https://github.com/alphagov/di-ipv-core-common-infra/tree/main/cloudformation/upload-assets).