import { CriStubDataConfig, criStubData } from "../data/cri-stub-data";

export function getCriStubTestDataConfig(
  scenario: string,
  cri: string,
): CriStubDataConfig {
  const testDataConfig = criStubData[scenario]?.[cri];

  if (!testDataConfig) {
    throw new Error(
      `No CRI stub data for persona '${scenario}' + CRI '${cri}'`,
    );
  }

  return testDataConfig;
}
