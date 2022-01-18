# Digital Identity Core Front

`di-ipv-core-front`

This is the home for the core front end user interface for the Identity Proofing and Verification (IPV) system within the GDS digital identity platform, GOV.UK Sign In. This is the first user facing screen within the Identity Proving journey. Other repositories are used for core backend services or credential issuers.

# Installation

Clone this repository and then run

```bash
yarn install
```

## Environment Variables

- 'BASE_URL': Externally accessible base url of the webserver. Used to generate the callback url as part of credential issuer oauth flows
- `PORT` - Default port to run webserver on. (Default to `3000`)
- `API_BASE_URL` - Base host of the backend API

### Code Owners

This repo has a `CODEOWNERS` file in the root and is configured to require PRs to reviewed by Code Owners.


