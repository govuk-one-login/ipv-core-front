#!/bin/bash

# This script must be run in a shell with sufficient AWS access.
# This can be achieved by using aws-vault and an amin role for example
# aws-vault exec di-ipv-dev -- ./deploy_to_dev_env.sh

declare -a stack_status=("UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE")
declare -a environments=("dev-danw" "dev-danp" "dev-danh" "dev-chrisw" "dev-amrits" "dev-kerrr" "dev-lait" "dev-ianj" "dev-derrenw" "dev-patrickb" "dev-vamh" "dev-wojciecho" "dev-aprilm")

export region=`aws configure get region`
export account_id=`aws sts get-caller-identity --query Account --output text`

function print_usage() {
  echo -e "\nUsage: $0:"
  echo -e "\t[-e] Provide environment name from: ${environments[*]}\n"
  echo -e "\t[-h] Print this usage guide\n"
}

function print_error() {
  printf "\t$0: Error: %s\n\n" "$*" >&2;
}

function process_args() {
  if [[ $# < 1 ]]; then
    print_usage
  fi

  while getopts fhx:i:e: flag; do
    case $flag in
      e) ENVIRONMENT=${OPTARG}
      ;;
      h) print_usage && exit 0
      ;;
      \?)
        print_error "Unrecognized argument '${OPTARG}'"
      ;;
      *) print_usage >&2
         exit 1
      ;;
    esac
  done

  [ -z $ENVIRONMENT ] || export ENVIRONMENT=$ENVIRONMENT
  [ -z $ENVIRONMENT ] && print_error "Environment Name: ${ENVIRONMENT} not provided (-e) :: exiting" && exit 1
}

function check_dependencies() {
  if ! which jq >/dev/null; then
    print_error "Please install jq to use this script - more info here: https://formulae.brew.sh/formula/jq"
    exit 1
  fi

  if ! docker info > /dev/null 2>&1 ; then
    print_error "Docker engine is not running, please start it. more info here: https://www.docker.com/products/docker-desktop/"
    exit 1
  fi
}

function check_connection() {

  if ! aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region ${region} > /dev/null 2>&1 ; then
    echo "The stack 'core-front-${ENVIRONMENT}' has not been found in region: ${region}."
    echo " - check the script has been run with the required permissions, e.g. aws-vault exec <profile> -- $0"
    echo " - check you are on the VPN"
    echo " - check whether your stack exists via the console or cli, if not you may need to: "
    echo "    - Run your developer pipeline in Concourse to create it"
    echo "    - if you do not have a developer pipeline then ask a team member to update di-ipv-config/core/ci/core-developer-pipelines"
    exit 1
  fi
}

function init() {
  if [[ " ${environments[*]} " =~ " ${ENVIRONMENT} " ]]; then
    echo "Environment: ${ENVIRONMENT} is good, proceeding"
  else
    print_error "'$ENVIRONMENT' does not match any of the valid known environments: ${environments[*]}"
    print_usage
    exit 1
  fi

  STACK_NAME="core-front-${ENVIRONMENT}"
  echo -e "\nCurrent Environment Configuration, as follows:"
  echo -e "\t* Region: '${region}'"
  echo -e "\t* Account ID: '${account_id}'"
  echo -e "\t* Environment: '${ENVIRONMENT}'"
  echo -e "\t* Stack Name: '${STACK_NAME}'\n"
  check_dependencies
  check_connection
}

function build_image() {
  DEV_IMAGE_TAG="${ENVIRONMENT}-$(date +%s)"
  local IMAGE_NAME_AND_TAG="core-front:${DEV_IMAGE_TAG}"
  local ecr_registry="130355686670.dkr.ecr.${region}.amazonaws.com"
  local REMOTE_IMAGE_NAME_AND_TAG="${ecr_registry}/core-front-development:${DEV_IMAGE_TAG}"

  docker build -t "$IMAGE_NAME_AND_TAG" ../
  echo "Logging into developement ECR registry"
  aws ecr get-login-password --region ${region} | \
  docker login --username AWS --password-stdin "${ecr_registry}"
  echo "Tagging docker image"
  docker tag "${IMAGE_NAME_AND_TAG}" "$REMOTE_IMAGE_NAME_AND_TAG"
  echo "Pushing development image to ECR"
  docker push "$REMOTE_IMAGE_NAME_AND_TAG"
}

function isStackUpdateComplete() {
  status="$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region eu-west-2 \
    | jq '.Stacks[].StackStatus' -r )"

  echo "Current status is: ${status}"
  if [[ " ${stack_status[*]} " =~ "${status}" ]]; then
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
                 ParameterKey=SubnetIds,UsePreviousValue=true \
                 ParameterKey=VpcId,UsePreviousValue=true \
    --capabilities CAPABILITY_IAM \
    --region eu-west-2

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
