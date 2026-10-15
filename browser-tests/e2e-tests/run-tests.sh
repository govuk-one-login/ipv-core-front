#!/bin/bash

#set -eu

function print_error_exit() {
  printf "\t$0: Error: %s\n\n" "$*" >&2;
  exit 1
}

# Configuring the various settings required
export ORCHESTRATOR_STUB_URL
#export BROWSER
#export NO_CHROME_SANDBOX
#export RUN_ARGS
export TEST_REPORT_ABSOLUTE_DIR
export CORE_FRONT_URL
export ASYNC_QUEUE_NAME
export CIMIT_MANAGEMENT_API_KEY

[ -z "$SAM_STACK_NAME" ] && SAM_STACK_NAME="core-front-dev"

# check to see if these environment variables exist or have been passed via a different method
# if they havent then export them and retrieve values from ssm parameter store
[ -z "$ORCHESTRATOR_STUB_URL" ] && ORCHESTRATOR_STUB_URL=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/orch_stub_url" | jq -r .Parameter.Value)
[ -z "$CORE_FRONT_URL" ] && CORE_FRONT_URL=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/service_url" | jq -r .Parameter.Value)
#[ -z "$BROWSER" ] && BROWSER=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/browser" | jq -r .Parameter.Value)
#[ -z "$NO_CHROME_SANDBOX" ] && NO_CHROME_SANDBOX=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/no_chrome_sandbox" | jq -r .Parameter.Value)
#[ -z "$RUN_ARGS" ] && RUN_ARGS=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/run_args" | jq -r .Parameter.Value)
[ -z "$TEST_REPORT_ABSOLUTE_DIR" ] && print_error_exit "TEST_REPORT_ABSOLUTE_DIR variable not set"
[ -z "$ASYNC_QUEUE_NAME" ] && ASYNC_QUEUE_NAME=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/async_queue_name" | jq -r .Parameter.Value)
[ -z "$CIMIT_MANAGEMENT_API_KEY" ] && CIMIT_MANAGEMENT_API_KEY=$(aws ssm get-parameter --name "/tests/${SAM_STACK_NAME}/cimit_api_key" | jq -r .Parameter.Value)

echo -e "\n\n***"
echo -e "Env Variables currently set as follows:"
echo -e "  * ORCHESTRATOR_STUB_URL: $ORCHESTRATOR_STUB_URL"
#echo -e "  * BROWSER: $BROWSER\n  * NO_CHROME_SANDBOX: $NO_CHROME_SANDBOX"
echo -e "  * CORE_FRONT_URL: $CORE_FRONT_URL"
echo -e "  * ASYNC_QUEUE_NAME: $ASYNC_QUEUE_NAME"
echo -e "  * CIMIT_MANAGEMENT_API_KEY: $CIMIT_MANAGEMENT_API_KEY"
echo -e "***\n\n"

[ -z "$ORCHESTRATOR_STUB_URL" ] && print_error_exit "ORCHESTRATOR_STUB_URL variable not set"
#[ -z "$BROWSER" ] && print_error_exit "BROWSER variable not set"
#[ -z "$NO_CHROME_SANDBOX" ] && print_error_exit "NO_CHROME_SANDBOX variable not set"
#[ -z "$RUN_ARGS" ] && print_error_exit "RUN_ARGS variable not set"
[ -z "$ASYNC_QUEUE_NAME" ] && print_error_exit "ASYNC_QUEUE_NAME variable not set"
[ -z "$CIMIT_MANAGEMENT_API_KEY" ] && print_error_exit "CIMIT_MANAGEMENT_API_KEY variable not set"

[ -d "$TEST_REPORT_ABSOLUTE_DIR" ] || mkdir -p "$TEST_REPORT_ABSOLUTE_DIR"

#if [ "$NO_CHROME_SANDBOX" == "true" ]; then
#  NO_CHROME_SANDBOX=true
#else
#  NO_CHROME_SANDBOX=false
#fi

# Changing to the working directory
cd /browser-tests || print_error_exit "Unable to Change Directory to browser-tests"

# Running the tests with all required variables. The reporters write directly to
# the CodeBuild-mounted directories passed in by the test step.
echo "$RUN_ARGS" | xargs npm run test:e2e
exit_code=$?

# CodeBuild expects Cucumber JSON in TEST_REPORT_ABSOLUTE_DIR.
report_generation_failed=0
if [ ! -s "$TEST_REPORT_ABSOLUTE_DIR/e2e.json" ]; then
  echo "No Cucumber JSON report was generated at $TEST_REPORT_ABSOLUTE_DIR/e2e.json" >&2
  report_generation_failed=1
fi

# Do not hide a report-generation failure when the tests themselves passed.
if [ "$exit_code" -eq 0 ] && [ "$report_generation_failed" -ne 0 ]; then
  exit_code=1
fi

echo "All tests completed; the current EXIT CODE is: ${exit_code}"
exit $exit_code
