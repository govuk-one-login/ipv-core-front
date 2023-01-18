#!/bin/bash

# This script must be run in a shell with sufficient AWS access.
# This can be achieved by using aws-vault and an amin role for example
# aws-vault exec di-ipv-dev -- ./deploy_to_dev_env.sh

declare -a stack_status=("UPDATE_COMPLETE" "UPDATE_ROLLBACK_COMPLETE")
dev_account_id="130355686670"

function print_usage() {
  echo -e "\nUsage: $0:"
  echo -e "\t[-e] Provide environment name it should be something like: 'dev-<yourusername>'"
  echo -e "\t     if unsure check https://github.com/alphagov/di-ipv-config/blob/main/core/ci/core-developer-pipelines/generate-pipelines/list_of_developers.txt"
  echo -e "\t     for your username\n"
  echo -e "\t[-h] Print this usage guide\n"
}

function print_error() {
  printf "\t$0: Error: %s\n\n" "$*" >&2;
}

function print_error_exit() {
  printf "\t$0: Error: %s\n\n" "$*" >&2;
  exit 1
}


function process_args() {
  if [[ $# -lt 1 ]]; then
    print_usage && exit 1
  fi

  while getopts he: flag; do
    case $flag in
      e) ENVIRONMENT=${OPTARG}
      ;;
      h) print_usage && exit 0
      ;;
      \?)
        print_error "Unrecognized argument '${OPTARG}'"
        print_usage && exit 1
      ;;
      *) print_usage && exit 1
      ;;
    esac
  done

  [ -z "$ENVIRONMENT" ] || export ENVIRONMENT=$ENVIRONMENT
  [ -z "$ENVIRONMENT" ] && print_error_exit "Environment Name: ${ENVIRONMENT} not provided (-e) :: exiting"
}

function check_dependencies() {
  if ! which jq >/dev/null; then
    print_error_exit "Please install jq to use this script - more info here: https://formulae.brew.sh/formula/jq"
  fi

  if ! docker info > /dev/null 2>&1 ; then
    print_error_exit "Docker engine is not running, please start it. more info here: https://www.docker.com/products/docker-desktop/"
  fi
}

function check_connection() {

  if ! aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "${region}" > /dev/null 2>&1 ; then
    echo "The stack 'core-front-${ENVIRONMENT}' has not been found in region: '${region}'."
    echo " - check the script has been run with the required permissions, e.g. aws-vault exec <profile> -- $0"
    echo " - check you are on the VPN"
    echo " - check whether your stack exists via the console or cli, if not you may need to: "
    echo "    - Run your developer pipeline in Concourse to create it"
    echo "    - if you do not have a developer pipeline then ask a team member to update di-ipv-config/core/ci/core-developer-pipelines"
    exit 1
  fi
}

function init() {
  region='eu-west-2'
  account_id=$(aws sts get-caller-identity --query Account --output text)
  STACK_NAME="core-front-${ENVIRONMENT}"
  DEV_IMAGE_TAG="${ENVIRONMENT}-$(date +%s)"

  echo -e "\nCurrent Environment Configuration, as follows:"
  echo -e "\t* Region:      '${region}'"
  echo -e "\t* Account ID:  '${account_id}'"
  echo -e "\t* Environment: '${ENVIRONMENT}'"
  echo -e "\t* Stack Name:  '${STACK_NAME}'"
  echo -e "\t* Image Tag:   '${DEV_IMAGE_TAG}'\n"

  check_dependencies
  if [[ "${dev_account_id}" != "${account_id}" ]]; then
    print_error "'${account_id}' does not match dev account id: ${dev_account_id} please connect to the dev account"
    check_connection
  fi

}

function build_image() {
  local IMAGE_NAME_AND_TAG="core-front:${DEV_IMAGE_TAG}"
  local ecr_registry="130355686670.dkr.ecr.${region}.amazonaws.com"
  local REMOTE_IMAGE_NAME_AND_TAG="${ecr_registry}/core-front-development:${DEV_IMAGE_TAG}"

  docker build -t "$IMAGE_NAME_AND_TAG" ../
  echo "Logging into developement ECR registry"
  aws ecr get-login-password --region "${region}" | \
  docker login --username AWS --password-stdin "${ecr_registry}"
  echo "Tagging docker image"
  docker tag "${IMAGE_NAME_AND_TAG}" "$REMOTE_IMAGE_NAME_AND_TAG"
  echo "Pushing development image to ECR"
  docker push "$REMOTE_IMAGE_NAME_AND_TAG"
}

function isStackUpdateComplete() {
  status="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "${region}" \
    | jq '.Stacks[].StackStatus' -r )"

  echo "Current status is: ${status}"
  if [[ " ${stack_status[*]} " =~ " ${status} " ]]; then
    return 0
  fi
  return 1
}

function update_stack() {
  echo "Updating stack to use development image"
  aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://../deploy/template.yaml \
    --parameters ParameterKey=ImageTag,ParameterValue="${DEV_IMAGE_TAG}" \
                 ParameterKey=Environment,UsePreviousValue=true \
                 ParameterKey=VpcStackName,UsePreviousValue=true \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND\
    --region "${region}"

  while ! isStackUpdateComplete
  do
    echo "Waiting 30s for stack to complete update"
    sleep 30
  done

  echo "Update complete"
}


process_args "$@"
init
build_image
update_stack
