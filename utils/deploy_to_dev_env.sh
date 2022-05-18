#!/bin/bash

# This script must be run in a shell with sufficient AWS access.
# This can be achieved by using aws-vault and an amin role for example
# aws-vault exec di-ipv-dev -- ./deploy_to_dev_env.sh

if ! which jq >/dev/null; then
  echo "Please install jq to use this script"
fi

if ! docker info > /dev/null 2>&1 ; then
  echo "Docker engine is not running, please start it."
  exit 1
fi

echo "Enter your developer environment prefix, for example 'dev-danw'"
read -r ENVIRONMENT

if [ -z "$ENVIRONMENT" ]; then
  echo "You must enter a non-empty string"
  exit 1
fi

STACK_NAME="core-front-${ENVIRONMENT}"
DEV_IMAGE_TAG="${ENVIRONMENT}-$(date +%s)"

if ! aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region eu-west-2 > /dev/null 2>&1 ; then
  echo "The stack 'core-front-${ENVIRONMENT}' does not exist. Ask in ipv-tech for help"
  exit 1
fi

IMAGE_NAME_AND_TAG="core-front:${DEV_IMAGE_TAG}"


docker build -t "$IMAGE_NAME_AND_TAG" ../

echo "Logging into developement ECR registry"
ecr_registry="130355686670.dkr.ecr.eu-west-2.amazonaws.com"
aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin "${ecr_registry}"

REMOTE_IMAGE_NAME_AND_TAG="${ecr_registry}/core-front-development:${DEV_IMAGE_TAG}"

echo "Tagging docker image"
docker tag "${IMAGE_NAME_AND_TAG}" "$REMOTE_IMAGE_NAME_AND_TAG"

echo "Pushing development image to ECR"
docker push "$REMOTE_IMAGE_NAME_AND_TAG"

function isStackUpdateComplete() {
  status="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region eu-west-2 \
    | jq '.Stacks[].StackStatus' -r )"

  echo "Current status is: ${status}"
  if [[ "$status" == "UPDATE_COMPLETE" ]]; then
    return 0
  fi
  return 1
}

echo "Updating stack to use development image"
aws cloudformation update-stack \
  --stack-name "$STACK_NAME" \
  --template-body file://../deploy/template.yaml \
  --parameters ParameterKey=ImageTag,ParameterValue="${DEV_IMAGE_TAG}" \
               ParameterKey=Environment,UsePreviousValue=true \
               ParameterKey=ApiBaseUrl,UsePreviousValue=true \
               ParameterKey=SubnetIds,UsePreviousValue=true \
               ParameterKey=VpcId,UsePreviousValue=true \
               ParameterKey=DesiredTaskCount,UsePreviousValue=true \
  --capabilities CAPABILITY_IAM \
  --region eu-west-2

while ! isStackUpdateComplete
do
  echo "Waiting 30s for stack to complete update"
  sleep 30
done

echo "Update complete"
