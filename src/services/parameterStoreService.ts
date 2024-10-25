import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

interface BannerConfig {
  pageId: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: string;
  endTime: string;
}

export const getParameter = async (name: string): Promise<JSON | undefined> => {
  const client = new SSMClient({ region: "eu-west-2" });
  const data = await client.send(new GetParameterCommand({ Name: name }));

  if (!data.Parameter?.Value) {
    return;
  }

  return JSON.parse(data.Parameter?.Value);
};

export const getNotificationBanner = async (): Promise<
  BannerConfig | undefined
> => {
  return (await getParameter("notification-banner")) as
    | BannerConfig
    | undefined;
};
