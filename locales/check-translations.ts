import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const englishTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "en/translation.json"), "utf-8"),
);
const welshTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "cy/translation.json"), "utf-8"),
);

type TranslationValue = string | string[] | TranslationObject;
interface TranslationObject {
  [key: string]: TranslationValue;
}

interface Issue {
  key?: string;
  issue: string;
  [prop: string]: unknown;
}

function getType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function collectTranslationLeafEntries(
  translations: TranslationObject,
  prefix = "",
): { key: string; value: TranslationValue }[] {
  const entries: { key: string; value: TranslationValue }[] = [];
  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (getType(value) === "object") {
      entries.push(
        ...collectTranslationLeafEntries(value as TranslationObject, fullKey),
      );
    } else {
      entries.push({ key: fullKey, value });
    }
  }
  return entries;
}

//qq:DCC can we do better with typing here?
function getTranslationFromFullyQualifiedName(
  translations: TranslationObject,
  keyPath: string,
): unknown {
  return keyPath
    .split(".")
    .reduce(
      (current: unknown, segment: string) =>
        current != null
          ? (current as Record<string, unknown>)[segment]
          : undefined,
      translations,
    );
}

// Find structural issues: missing keys, type mismatches, array length mismatches
function findStructuralIssues(
  englishObj: TranslationObject | null,
  welshObj: TranslationObject | null,
  keyPath = "",
): Issue[] {
  const issues: Issue[] = [];
  const combinedKeys = new Set([
    ...Object.keys(englishObj || {}),
    ...Object.keys(welshObj || {}),
  ]);

  for (const key of combinedKeys) {
    const fullKey = keyPath ? `${keyPath}.${key}` : key;
    const existsInEnglish = englishObj != null && key in englishObj;
    const existsInWelsh = welshObj != null && key in welshObj;

    if (!existsInWelsh) {
      issues.push({ key: fullKey, issue: "missing_in_welsh" });
    } else if (!existsInEnglish) {
      issues.push({ key: fullKey, issue: "missing_in_english" });
    } else {
      const englishType = getType(englishObj![key]);
      const welshType = getType(welshObj![key]);
      if (englishType !== welshType) {
        issues.push({
          key: fullKey,
          issue: "type_mismatch",
          englishType,
          welshType,
        });
      } else if (englishType === "object") {
        issues.push(
          ...findStructuralIssues(
            englishObj![key] as TranslationObject,
            welshObj![key] as TranslationObject,
            fullKey,
          ),
        );
      } else if (
        englishType === "array" &&
        (englishObj![key] as string[]).length !==
          (welshObj![key] as string[]).length
      ) {
        issues.push({
          key: fullKey,
          issue: "array_length_mismatch",
          englishLength: (englishObj![key] as string[]).length,
          welshLength: (welshObj![key] as string[]).length,
        });
      }
    }
  }
  return issues;
}

// Keys where the Welsh value is intentionally identical to the English value.
const UNTRANSLATED_WHITELIST = new Set([
  "error.serviceUnavailable.title",
  "error.serviceUnavailable.headerEn",
  "error.serviceUnavailable.headerCy",
  "error.serviceUnavailable.content.paragraph1En",
  "error.serviceUnavailable.content.paragraph1Cy",
  "error.serviceUnavailable.content.subHeadingEn",
  "error.serviceUnavailable.content.subHeadingCy",
  "error.serviceUnavailable.content.paragraph2En",
  "error.serviceUnavailable.content.paragraph2Cy",
  "error.serviceUnavailable.content.paragraph3En",
  "error.serviceUnavailable.content.paragraph3Cy",
  "general.shared.govUKHomepageButtonHref",
  "pages.pageF2fHandoff.content.firstCircle",
  "pages.pageF2fHandoff.content.secondCircle",
  "pages.pageF2fHandoff.content.thirdCircle",
]);

for (const key of UNTRANSLATED_WHITELIST) {
  if (
    getTranslationFromFullyQualifiedName(englishTranslations, key) === undefined
  ) {
    throw new Error(
      `UNTRANSLATED_WHITELIST contains "${key}" which does not exist in English translations`,
    );
  }
}

// English text values where inconsistent Welsh translations are expected
// (e.g. due to different capitalisation in the Welsh text and Welsh soft mutations).
const INCONSISTENT_TRANSLATION_WHITELIST = new Set([
  "UK passport",
  "UK photocard driving licence",
  "UK biometric residence card or permit",
]);

// Find cases where the same English text maps to different Welsh translations
function findInconsistentTranslations(untranslatedKeys: Set<string>): Issue[] {
  const englishLeafEntries = collectTranslationLeafEntries(englishTranslations);
  const englishTextToWelshTranslations = new Map<
    string,
    { key: string; welshTranslation: string }[]
  >();

  for (const { key, value } of englishLeafEntries) {
    if (typeof value !== "string") continue;
    if (UNTRANSLATED_WHITELIST.has(key)) continue;
    if (untranslatedKeys.has(key)) continue;
    const welshValue = getTranslationFromFullyQualifiedName(
      welshTranslations,
      key,
    );
    if (typeof welshValue !== "string") continue;

    if (!englishTextToWelshTranslations.has(value)) {
      englishTextToWelshTranslations.set(value, []);
    }
    englishTextToWelshTranslations
      .get(value)!
      .push({ key, welshTranslation: welshValue });
  }

  const issues: Issue[] = [];
  for (const [englishText, entries] of englishTextToWelshTranslations) {
    const uniqueTranslations = new Set(
      entries.map((entry) => entry.welshTranslation),
    );
    if (
      uniqueTranslations.size > 1 &&
      !INCONSISTENT_TRANSLATION_WHITELIST.has(englishText)
    ) {
      issues.push({
        issue: "inconsistent_translation",
        englishText,
        translations: entries,
      });
    }
  }
  return issues;
}

// Keys used by the @govuk-one-login/frontend-ui base template (ipv-core-base.njk)
// but not referenced directly in this project's source files.
const BASE_TEMPLATE_KEYS = new Set([
  "general.govuk.errorTitlePrefix",
  "general.govuk.backLink",
]);

// Translation keys referenced in TypeScript source files.
// Maintained as an allow list to avoid scanning all TS files.
const TS_TRANSLATION_KEYS = new Set([
  "general.govuk.notificationBanner.title",
  "pages.pageIpvReuse.content.userDetailsInformation.currentAddress",
]);

for (const key of TS_TRANSLATION_KEYS) {
  if (
    getTranslationFromFullyQualifiedName(englishTranslations, key) === undefined
  ) {
    throw new Error(
      `TS_TRANSLATION_KEYS contains "${key}" which does not exist in English translations`,
    );
  }
}

for (const key of BASE_TEMPLATE_KEYS) {
  if (
    getTranslationFromFullyQualifiedName(englishTranslations, key) === undefined
  ) {
    throw new Error(
      `BASE_TEMPLATE_KEYS contains "${key}" which does not exist in English translations`,
    );
  }
}

// Find entries where the Welsh translation is identical to the English
function findUntranslatedKeys(): Set<string> {
  const englishLeafEntries = collectTranslationLeafEntries(englishTranslations);
  const keys = new Set<string>();
  for (const { key, value } of englishLeafEntries) {
    if (typeof value !== "string") continue;
    if (UNTRANSLATED_WHITELIST.has(key)) continue;
    const welshValue = getTranslationFromFullyQualifiedName(
      welshTranslations,
      key,
    );
    if (value === welshValue) keys.add(key);
  }
  return keys;
}

// Find translation keys not referenced by any source file
function findUnusedTranslations(): Issue[] {
  const projectRoot = path.join(__dirname, "..");

  function getFilesRecursively(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getFilesRecursively(fullPath, extensions));
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const viewsDir = path.join(projectRoot, "views");
  if (!fs.existsSync(viewsDir)) {
    throw new Error(`Views directory not found at ${viewsDir}`);
  }
  const njkFiles = getFilesRecursively(viewsDir, [".njk"]);
  if (njkFiles.length === 0) {
    throw new Error(`No .njk files found in ${viewsDir}`);
  }
  const allNjkContent = njkFiles
    .map((filePath) => fs.readFileSync(filePath, "utf-8"))
    .join("\n");

  // Build per-page context suffixes from pages-and-contexts.
  // translateWithPageContext(OrFallback) appends kebabCaseToPascalCase(contextValue) to keys.
  const kebabCaseToPascalCase = (input: string): string => {
    const camelCased = input.replace(/-([a-zA-Z])/g, (match) =>
      match.charAt(1).toUpperCase(),
    );
    return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pagesAndContexts } = require(
    path.join(projectRoot, "src/test-utils/pages-and-contexts.ts"),
  ) as {
    pagesAndContexts: Record<string, Record<string, Record<string, unknown>>[]>;
  };

  // Map from njk file content to the context suffixes for that page.
  const pageContextEntries: { njkContent: string; suffixes: Set<string> }[] =
    [];
  for (const [pageId, contextVariants] of Object.entries(pagesAndContexts)) {
    const suffixes = new Set<string>();
    for (const variant of contextVariants) {
      for (const contextValues of Object.values(variant)) {
        for (const [contextKey, contextValue] of Object.entries(
          contextValues,
        )) {
          if (typeof contextValue === "boolean") {
            if (contextValue) {
              suffixes.add(kebabCaseToPascalCase(contextKey));
            }
          } else if (typeof contextValue === "string") {
            suffixes.add(kebabCaseToPascalCase(contextValue));
          } else {
            throw new Error(
              `Unexpected context value type "${typeof contextValue}" for key "${contextKey}" in page "${pageId}"`,
            );
          }
        }
      }
    }
    if (suffixes.size === 0) continue;

    const njkPath = path.join(viewsDir, "ipv", "page", `${pageId}.njk`);
    if (!fs.existsSync(njkPath)) {
      throw new Error(
        `Page "${pageId}" has context variants but no njk file at ${njkPath}`,
      );
    }
    const njkContent = fs.readFileSync(njkPath, "utf-8");
    pageContextEntries.push({ njkContent, suffixes });
  }

  const leafKeys = collectTranslationLeafEntries(englishTranslations).map(
    (leaf) => leaf.key,
  );

  return leafKeys
    .filter((key) => {
      if (BASE_TEMPLATE_KEYS.has(key)) return false;
      if (TS_TRANSLATION_KEYS.has(key)) return false;
      if (allNjkContent.includes(key)) return false;

      // Only pages.* keys can have context variants.
      // Check if this key minus a context suffix appears in the
      // njk file for the page that defines that context.
      if (key.startsWith("pages.")) {
        for (const { njkContent, suffixes } of pageContextEntries) {
          for (const suffix of suffixes) {
            if (
              key.endsWith(suffix) &&
              njkContent.includes(key.slice(0, -suffix.length))
            ) {
              return false;
            }
          }
        }
      }
      return true;
    })
    .map((key) => ({ key, issue: "unused" }));
}

const untranslatedKeys = findUntranslatedKeys();

const issues = [
  ...findStructuralIssues(englishTranslations, welshTranslations),
  ...findInconsistentTranslations(untranslatedKeys),
  ...findUnusedTranslations(),
];

// Build nested structure for untranslated entries using the English text as values
const untranslated: Record<string, unknown> = {};
for (const key of untranslatedKeys) {
  const segments = key.split(".");
  let current = untranslated;
  for (let i = 0; i < segments.length - 1; i++) {
    current[segments[i]] ??= {};
    current = current[segments[i]] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = getTranslationFromFullyQualifiedName(
    englishTranslations,
    key,
  );
}

const output = {
  issues,
  untranslated,
};

const outputPath = path.join(__dirname, "translation-inconsistencies.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
const totalProblems = issues.length + untranslatedKeys.size;
console.log(
  `Found ${issues.length} issues and ${untranslatedKeys.size} untranslated entries. Output written to ${outputPath}`,
);
if (totalProblems > 0) process.exit(1);
