import {
  SSMClient,
  GetParameterCommand,
  paginateGetParametersByPath,
} from "@aws-sdk/client-ssm";
import config from "../config/config";

type CacheEntry<T> = { value: Promise<T>; expiration: number };

const client = new SSMClient({ region: "eu-west-2" });
const parameterCache = new Map<string, CacheEntry<string | undefined>>();
const parametersByPathCache = new Map<
  string,
  CacheEntry<Record<string, string>>
>();

const withCache = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const cached = cache.get(key);
  if (cached && cached.expiration > Date.now()) {
    return cached.value;
  }

  const value = fetcher();
  cache.set(key, {
    value,
    expiration: Date.now() + Number(config.SSM_PARAMETER_CACHE_TTL),
  });

  return value;
};

export const getParameter = (name: string): Promise<string | undefined> =>
  withCache(parameterCache, name, async () => {
    const data = await client.send(new GetParameterCommand({ Name: name }));
    return data.Parameter?.Value;
  });

export const getParametersByPath = (
  path: string,
): Promise<Record<string, string>> =>
  withCache(parametersByPathCache, path, async () => {
    const result: Record<string, string> = {};

    // Transparently page through all SSM results, collecting them into one map.
    for await (const page of paginateGetParametersByPath(
      { client },
      { Path: path, Recursive: true },
    )) {
      for (const { Name, Value } of page.Parameters ?? []) {
        if (Name && Value !== undefined) {
          result[Name] = Value;
        }
      }
    }

    return result;
  });
