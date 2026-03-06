import dotenv from "dotenv";

dotenv.config({ path: "e2e-tests/.env" });

const getEnvironmentVariableOrError = (variable: string): string => {
  const value = process.env[variable];
  if (!value || value.trim() === "") {
    throw new Error(
      `Required environment variable '${variable}' is not set or is blank`,
    );
  }
  return value;
};

const getEnvironmentVariableOrDefault = (
  variable: string,
  defaultValue: string,
): string => {
  const value = process.env[variable];
  return !value || value.trim() === "" ? defaultValue : value;
};

const config = {
  orchestratorStubUrl: getEnvironmentVariableOrError("ORCHESTRATOR_STUB_URL"),
  orchStubTargetEnv: getEnvironmentVariableOrDefault(
    "ORCH_STUB_TARGET_ENV",
    "default",
  ),
  coreFrontUrl: getEnvironmentVariableOrError("CORE_FRONT_URL"),
  asyncQueueName: getEnvironmentVariableOrError("ASYNC_QUEUE_NAME"),
  dcmawAsyncUrl: getEnvironmentVariableOrDefault(
    "ASYNC_DCMAW_STUB_URL",
    "https://dcmaw-async.stubs.account.gov.uk",
  ),
};

export default config;
