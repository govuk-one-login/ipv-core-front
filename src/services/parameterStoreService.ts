import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

interface BannerConfig {
  pageId: string;
  bannerType?: string;
  bannerMessage: string;
  bannerMessageCy: string;
  startTime: number;
  endTime: number;
}

export const getParameter = async (
  name: string,
): Promise<BannerConfig | undefined> => {
  if (process.env.NODE_ENV === "local") {
    return JSON.parse(process.env[name] ?? "{}");
  }

  const client = new SSMClient({ region: "eu-west-2" });
  const data = await client.send(new GetParameterCommand({ Name: name }));

  if (!data.Parameter?.Value) {
    return;
  }

  return JSON.parse(data.Parameter?.Value);
};
