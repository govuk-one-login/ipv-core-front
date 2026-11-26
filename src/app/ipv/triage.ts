import BadRequestError from "../../errors/bad-request-error";
import IPV_PAGES from "../../constants/ipv-pages";

interface TriagePage {
  // Name of the form field whose submitted value(s) are the user's answer(s)
  answerField: string;
}

// Pages that ask a triage question. When one of these pages is submitted the answers are sent to
// core-back before the journey event, so that dynamic routing can use them. core-back validates
// the page id and answers, so any change here needs a matching change in core-back.
export const TRIAGE_PAGES: ReadonlyMap<string, TriagePage> = new Map([
  // The radio buttons are named "journey", so the selected value is also the journey event
  [IPV_PAGES.LIVE_IN_UK, { answerField: "journey" }],
]);

// Radio buttons submit a string and check boxes submit a string, or an array of strings when more
// than one is ticked, so both are normalised to an array.
export const getTriageAnswers = (
  body: Record<string, unknown> | undefined,
  answerField: string,
): string[] => {
  const submitted: unknown = body?.[answerField];

  if (typeof submitted === "string") {
    return [submitted];
  }

  if (
    Array.isArray(submitted) &&
    submitted.every((answer) => typeof answer === "string")
  ) {
    return submitted;
  }

  throw new BadRequestError(
    `${answerField} must be a string or array of strings`,
  );
};
