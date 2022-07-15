#!/bin/bash

# This script must be run in a shell with sufficient AWS access.
# This can be achieved by using aws-vault and an amin role for example
# aws-vault exec di-ipv-dev -- ./deploy_to_dev_env.sh

declare -a stack_status=("UPDATE_COMPLETE" "CREATE_COMPLETE" "UPDATE_ROLLBACK_COMPLETE")
declare -a deploy_types=("deploy" "update")

function print_usage() {
  echo -e "\nUsage: $0:"
  echo -e "\t[-e] Provide environment name it should be something like: 'dev-<yourusername>'"
  echo -e "\t     if unsure check https://github.com/alphagov/di-ipv-config/blob/main/core/ci/core-developer-pipelines/gene  rate-pipelines/list_of_developers.txt"
  echo -e "\t     for your username\n"
  echo -e "\t[-i] Provide Image Tag\n"
  echo -e "\t[-t] Provide deployment type from: ${deploy_types[*]}, defaults to 'update'\n"
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

  while getopts he:i:t: flag; do
    case $flag in
      e) ENVIRONMENT=${OPTARG}
      ;;
      i) IMAGE_TAG=${OPTARG}
      ;;
      t) DEPLOY_TYPE=${OPTARG}
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
  [ -z "$DEPLOY_TYPE" ] && DEPLOY_TYPE="update"
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
  if [[ ! " ${deploy_types[*]} " =~ " ${DEPLOY_TYPE} " ]]; then
    print_error "'$DEPLOY_TYPE' does not match any of the valid known deployment types: ${deploy_types[*]}"
    print_usage
    exit 1
  fi

  region=$(aws configure get region)
  account_id=$(aws sts get-caller-identity --query Account --output text)
  STACK_NAME="core-front-${ENVIRONMENT}"
  DEV_IMAGE_TAG="${ENVIRONMENT}-$(date +%s)"
  [ -z "${IMAGE_TAG}" ] || DEV_IMAGE_TAG="${IMAGE_TAG}"
  IMAGE_NAME_AND_TAG="core-front:${DEV_IMAGE_TAG}"
  echo -e "\nCurrent Environment Configuration, as follows:"
  echo -e "\t* Deployment Type:  '${DEPLOY_TYPE}'"
  echo -e "\t* Region:           '${region}'"
  echo -e "\t* Account ID:       '${account_id}'"
  echo -e "\t* Environment:      '${ENVIRONMENT}'"
  echo -e "\t* Stack Name:       '${STACK_NAME}'"
  echo -e "\t* Image Tag:        '${DEV_IMAGE_TAG}'"
  echo -e "\t* Image Name & Tag: '${IMAGE_NAME_AND_TAG}'\n"
  check_dependencies
  if [[ "${DEPLOY_TYPE}" == "update" ]]; then
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
    --region eu-west-2 \
    | jq '.Stacks[].StackStatus' -r )"

  echo "Current status is: ${status}"
  if [[ " ${stack_status[*]} " =~ " ${status} " ]]; then
    return 0
  fi
  return 1
}

function deploy_stack() {
  echo "Deploying stack to use development image"
  local STACKS
  local CORE_VPC_ID
  local CORE_PRIVATE_SUBNETS
  STACKS=$(aws cloudformation describe-stacks --stack-name "network-shared-development")
  CORE_VPC_ID=$(jq -r '.Stacks[].Outputs[] | select(.OutputKey == "CoreVPCID").OutputValue' <(echo "$STACKS"))
  CORE_PRIVATE_SUBNETS=$(jq -r '.Stacks[].Outputs[] | select(.OutputKey == "CorePrivateSubnets").OutputValue' <(echo "$STACKS"))


  echo "Start Cloud Formation Deploymeyynt"
  echo -e "Deploying Using the following:\n\t* VPC ID:${CORE_VPC_ID}\n\t* Subnet: ${CORE_PRIVATE_SUBNETS}\n\t* Stacks: ${STACKS}"
  aws cloudformation deploy \
    --stack-name "${STACK_NAME}" \
    --template-file "../deploy/template.yaml" \
    --region "eu-west-2" \
    --capabilities "CAPABILITY_NAMED_IAM" \
    --parameter-overrides Environment="${ENVIRONMENT}" VpcId="${CORE_VPC_ID}" \
    SubnetIds="${CORE_PRIVATE_SUBNETS}" ImageTag="${IMAGE_TAG}"

  while ! isStackUpdateComplete
    do
      echo "Waiting 30s for stack to complete update"
      sleep 30
    done

  echo "cloud formation deploy complete"
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
"${DEPLOY_TYPE}"_stack
