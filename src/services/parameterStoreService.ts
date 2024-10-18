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
    return {
      pageId: "/dev/template/confirm-your-details/en",
      bannerMessage: "<h3>Test banner</h3> <p>This is a test banner</p>",
      bannerMessageCy:
        "<h3>Welsh Test banner</h3> <p>This is a Welsh test banner</p>",
      startTime: Date.now(),
      endTime: Date.now() + 1000 * 60 * 60 * 24,
    };
  }

  const client = new SSMClient({ region: "eu-west-2" });
  const data = await client.send(new GetParameterCommand({ Name: name }));

  if (!data.Parameter?.Value) {
    return;
  }

  return JSON.parse(data.Parameter?.Value);
};

module.exports = { getParameter };
