import { PublicQuestionSet, QuestionSet } from "./types";

export function publicSet(set: QuestionSet): PublicQuestionSet {
  return {
    id: set.id,
    name: set.name,
    mode1_main_question: set.mode1_main_question,
    mode1_questions: (set.mode1_questions || []).map((q) => ({
      id: q.id,
      prompt_text: q.prompt_text,
      prompt_image_url: q.prompt_image_url ?? null,
      choices: q.choices,
    })),
    mode2_question: set.mode2_question,
    mode2_image_url: set.mode2_image_url ?? null,
    mode2_choices: set.mode2_choices || [],
    mode3_question: set.mode3_question,
    mode3_image_url: set.mode3_image_url ?? null,
    mode4_question: set.mode4_question,
    mode4_properties: set.mode4_properties || [],
  };
}
