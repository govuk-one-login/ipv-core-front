import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

export interface BannerConfig {
  pageId: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: string;
  endTime: string;
}

const parameterCache: Map<string, { value: JSON; expiration: number }> =
  new Map();

export const getParameter = async (name: string): Promise<JSON | undefined> => {
  const cacheDuration = 5 * 60 * 1000; // Cache duration in milliseconds (5 minutes)
  const cachedParam = parameterCache.get(name);
  if (cachedParam && cachedParam.expiration > Date.now()) {
    return cachedParam.value;
  }
  const client = new SSMClient({ region: "eu-west-2" });
  const data = await client.send(new GetParameterCommand({ Name: name }));

  if (!data.Parameter?.Value) {
    return;
  }

  const parameterValue = JSON.parse(data.Parameter?.Value);
  parameterCache.set(name, {
    value: parameterValue,
    expiration: Date.now() + cacheDuration,
  });

  return parameterValue;
};

export const getNotificationBanner = async (): Promise<
  BannerConfig[] | undefined
> => {
  return (await getParameter("notification-banner")) as
    | BannerConfig[]
    | undefined;
};
