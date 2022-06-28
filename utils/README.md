### How to use the deploy_to_dev_env.sh script

#### Purpose

This script will build the core-front docker image form your local source code and push the image into the development account's `core-front-development` registry. It will then update your core-front stack to use the image.

### How it works

- Run the `deploy_to_dev_env.sh` within a shell with AWS credentials to describe/update stacks and push images in the IPV Core Development account (most developers have an admin role in our development account which will work), for example:

  `aws-vault exec di-ipv-dev -- ./deploy_to_dev_env.sh -e dev-<username>`

- Provide the name of your developer environment using -e,  this will likely be `dev-<your fist name and first initial>` for example, `dev-danw`.
- The script will check that your stack exists and you have the necessary binaries installed and processes running.
- Builds the core-front docker image with the tag of `<your environment>-<epoch seconds>`
- Pushes the core-front docker image into the `core-front-development` ECR registry in the ipv core development account.
- Updates the task definition in your core-front stack to reference the development image it has just pushed.
- Waits for your core-front stack to update, this can take a minute or two.

### How to reset your environment

Trigger the deployment of your environment within `core-developer-environments` Concourse pipeline. This will redeploy everything back to `main` branch.
