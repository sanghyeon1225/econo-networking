import bundledQuestions from "../../questions.md?raw";

const MARKDOWN_HEADING = /^#{1,6}\s+/;
const MARKDOWN_DIVIDER = /^-{3,}$/;
const MARKDOWN_LIST_MARKER = /^[-*+]\s+/;
const BOLD_MARKER = /\*\*/g;
const DECORATIVE_HEADING = /^[^\p{L}\p{N}]*\*\*.+\*\*\s*$/u;

export function parseQuestions(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !MARKDOWN_HEADING.test(line))
    .filter((line) => !MARKDOWN_DIVIDER.test(line))
    .filter((line) => !DECORATIVE_HEADING.test(line))
    .map((line) => line.replace(MARKDOWN_LIST_MARKER, ""))
    .map((line) => line.replace(BOLD_MARKER, "").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^[^\p{L}\p{N}]+$/u.test(line));
}

export async function loadQuestions() {
  try {
    const response = await fetch("/questions.md", { cache: "no-store" });

    if (response.ok) {
      const questions = parseQuestions(await response.text());

      if (questions.length > 0) {
        return questions;
      }
    }
  } catch {
    // The bundled fallback keeps the app deployable when /public/questions.md is absent.
  }

  return parseQuestions(bundledQuestions);
}
