import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import config from "../lib/config";

const client = new SSMClient({ region: "eu-west-2" });

const parameterCache: Map<
  string,
  { value: string | undefined; expiration: number }
> = new Map();

export const getParameter = async (
  name: string,
): Promise<string | undefined> => {
  const cachedParam = parameterCache.get(name);
  if (cachedParam && cachedParam.expiration > Date.now()) {
    return cachedParam.value;
  }

  const data = await client.send(new GetParameterCommand({ Name: name }));

  parameterCache.set(name, {
    value: data.Parameter?.Value,
    expiration: Date.now() + Number(config.SSM_PARAMETER_CACHE_TTL),
  });

  return data.Parameter?.Value;
};
