import {
  DevTemplatePages,
  NO_CONTEXT_VARIANT,
  pagesAndContexts,
} from "../../src/test-utils/pages-and-contexts";

type TestFn = (
  pageName: DevTemplatePages,
  context: Record<string, object> | typeof NO_CONTEXT_VARIANT,
  language: string,
  url: string,
) => void;

export const iteratePagesAndContexts = (test: TestFn): void => {
  for (const pageName of Object.keys(
    pagesAndContexts,
  ) as Array<DevTemplatePages>) {
    const pageContexts = pagesAndContexts[pageName];
    const contextsToTest =
      pageContexts.length > 0 ? pageContexts : [NO_CONTEXT_VARIANT];

    for (const contextScenario of contextsToTest) {
      for (const language of ["en", "cy"]) {
        let url = `${process.env.WEBSITE_HOST}/dev/template/${pageName}/${language}?pageErrorState=true&snapshotTest=true`;
        if (contextScenario !== NO_CONTEXT_VARIANT) {
          const contextValue = Object.values(contextScenario)[0];
          url += `&pageContext=${encodeURIComponent(JSON.stringify(contextValue))}`;
        }
        test(pageName, contextScenario, language, url);
      }
    }
  }
};
