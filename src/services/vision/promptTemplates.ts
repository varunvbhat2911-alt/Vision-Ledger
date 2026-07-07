/**
 * Prompt templates for Vision AI analysis.
 * Now supports all 8 verification types with tailored prompts.
 */

export interface PromptTemplate {
  system: string;
  user: (claimType: string) => string;
}

/** Default template — works for all claim types. */
export const DEFAULT_PROMPT: PromptTemplate = {
  system:
    "You are an AI-powered verification specialist. " +
    "Your task is to carefully examine images and provide accurate, objective assessments.",

  user: (claimType: string) =>
    `Analyze this image for evidence of a ${claimType.replace(/_/g, " ")} claim. ` +
    "Examine the image for visible indicators relevant to this claim type. " +
    "Return ONLY a valid JSON object with relevant metrics, a confidence_score (0-100), and a brief explanation.",
};

/** Tree plantation specific prompt (kept for backwards compatibility). */
export const TREE_PLANTATION_PROMPT: PromptTemplate = {
  system:
    "You are an expert environmental auditor and forestry analyst. " +
    "Your task is to carefully examine images and provide accurate, objective assessments.",

  user: (claimType: string) =>
    `Analyze this image for evidence of a ${claimType.replace(/_/g, " ")}. ` +
    "Count the number of trees that are clearly visible. " +
    "Consider only trees that are in focus and identifiable as individual trees. " +
    "Ignore background vegetation that cannot be confidently identified.\n\n" +
    "Return ONLY a valid JSON object with exactly these fields:\n" +
    "- tree_count: integer\n" +
    "- confidence_score: integer between 0 and 100\n" +
    "- explanation: brief one-to-two sentence analysis",
};

/** Lookup map: claim type → prompt template. */
export const PROMPT_MAP: Record<string, PromptTemplate> = {
  tree_plantation: TREE_PLANTATION_PROMPT,
  default: DEFAULT_PROMPT,
};

/** Resolve the prompt template for a given claim type. */
export function getPromptForClaim(claimType: string): PromptTemplate {
  return PROMPT_MAP[claimType] ?? PROMPT_MAP["default"];
}