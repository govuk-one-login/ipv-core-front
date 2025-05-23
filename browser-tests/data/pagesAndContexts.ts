import { pagesAndContexts } from "../../src/test-utils/pages-and-contexts";

type TestFn = (
  pageName: string,
  context: string | undefined,
  language: string,
  url: string,
) => void;

export const iteratePagesAndContexts = (test: TestFn): void => {
  for (const pageName of Object.keys(pagesAndContexts)) {
    const contexts = pagesAndContexts[pageName];
    const contextsToTest = contexts.length > 0 ? contexts : [undefined];

    for (const context of contextsToTest) {
      for (const language of ["en", "cy"]) {
        let url = `${process.env.WEBSITE_HOST}/dev/template/${pageName}/${language}?pageErrorState=true&snapshotTest=true`;
        if (context !== undefined) {
          url += `&context=${context}`;
        }
        test(pageName, context, language, url);
      }
    }
  }
};
