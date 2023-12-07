# Digital Identity Core Front

`di-ipv-core-front`

This is the home for the core front end user interface for the Identity Proofing and Verification (IPV) system within the GDS digital identity platform, GOV.UK Sign In. This is the first user facing screen within the Identity Proving journey. Other repositories are used for core backend services or credential issuers.

# Installation

Clone this repository and then run

```bash
npm install
```

## Environment Variables

- 'BASE_URL': Externally accessible base url of the webserver. Used to generate the callback url as part of credential issuer oauth flows
- `PORT` - Default port to run webserver on. (Default to `3000`)
- `API_BASE_URL` - Base host of the backend API

## Running Locally

Create a .env file based on .env.sample
Run `npm run build`
In your IDE set up a run configuration that starts `src/app.js` and use that (or run `npm run start-dev`)
To get live updating of styles run `npm run watch-sass`
Changes to the govuk-frontend library, translations, or images require you to run `npm run build` again.

### Configuring core-back to work with a local core-front
In the core common infra repository dev-deploy documentation there are instructions on how to configure your dev
stack to work with a locally running core-front.

### Code Owners

This repo has a `CODEOWNERS` file in the root and is configured to require PRs to reviewed by Code Owners.

## Pre-Commit Checking / Verification

Completely optional, there is a `.pre-commit-config.yaml` configuration setup in this repo, this uses [pre-commit](https://pre-commit.com/) to verify your commit before actually commiting, it runs the following checks:

- Check Json files for formatting issues
- Fixes end of file issues (it will auto correct if it spots an issue - you will need to run the git commit again after it has fixed the issue)
- It automatically removes trailing whitespaces (again will need to run commit again after it detects and fixes the issue)
- Detects aws credentials or private keys accidentally added to the repo
- runs cloud formation linter and detects issues
- runs checkov and checks for any issues.

### Dependency Installation

To use this locally you will first need to install the dependencies, this can be done in 2 ways:

#### Method 1 - Python pip

Run the following in a terminal:

```
sudo -H pip3 install checkov pre-commit cfn-lint
```

this should work across platforms

#### Method 2 - Brew

If you have brew installed please run the following:

```
brew install pre-commit ;\
brew install cfn-lint ;\
brew install checkov
```

### Post Installation Configuration

once installed run:

```
pre-commit install
```

To update the various versions of the pre-commit plugins, this can be done by running:

```
pre-commit autoupdate && pre-commit install
```

This will install / configure the pre-commit git hooks, if it detects an issue while committing it will produce an output like the following:

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

### Assets upload to  CDN
There is a step in the github workflow secure-post-merge.yml which pushes a zip of the /public
and /assets folders to an S3 bucket, this is then decompressed and put into another bucket
which is behind a cloudfront distribution. The infra for this is in:
[https://github.com/alphagov/di-ipv-core-common-infra/tree/main/cloudformation/upload-assets](https://github.com/alphagov/di-ipv-core-common-infra/tree/main/cloudformation/upload-assets)
If you add a new mimetype to the /assets or /public folders it will need to be added to the cloudfront
function in that repo.
