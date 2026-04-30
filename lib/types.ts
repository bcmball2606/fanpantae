// Shared TypeScript types for the Fanpantae GeoGuessr game

export type Mode1SubQuestion = {
  id: string;
  prompt_text: string;
  prompt_image_url?: string | null;
  // 4 choices in admin-defined order
  choices: string[];
  correct_index: number; // 0..3
};

export type QuestionSet = {
  id: string;
  name: string;
  pin: string;
  is_open: boolean;

  // Mode 1
  mode1_main_question: string;
  mode1_questions: Mode1SubQuestion[];

  // Mode 2
  mode2_question: string;
  mode2_image_url?: string | null;
  mode2_answer: string;
  mode2_choices: string[]; // 5 choices for the "open choices" helper

  // Mode 3 (jigsaw 5x5)
  mode3_question: string;
  mode3_image_url: string | null;
  mode3_answer: string;

  // Mode 4 (5 properties)
  mode4_question: string;
  mode4_answer: string;
  mode4_properties: string[]; // 5 strings

  created_at: string;
};

// Sanitized version sent to client during play (no answer keys leaked)
export type PublicQuestionSet = {
  id: string;
  name: string;

  mode1_main_question: string;
  mode1_questions: {
    id: string;
    prompt_text: string;
    prompt_image_url?: string | null;
    choices: string[];
  }[];

  mode2_question: string;
  mode2_image_url?: string | null;
  mode2_choices: string[];

  mode3_question: string;
  mode3_image_url: string | null;

  mode4_question: string;
  mode4_properties: string[];
};

export type AttemptProgress = {
  // Mode 1
  m1_index: number;          // current sub-question index (0..24)
  m1_score: number;          // 0..25
  m1_done: boolean;
  m1_ended_reason?: "complete" | "wrong" | "timeout";
  m1_results?: { qIndex: number; outcome: "correct" | "wrong" | "skip"; correct_index: number }[];

  // Mode 2
  m2_revealed_choices: boolean;
  m2_eliminated: number;     // number of choices eliminated (0..3 because 5→4→3→2)
  m2_score: number;
  m2_done: boolean;
  m2_eliminated_indices?: number[]; // indices of choices removed

  // Mode 3
  m3_opened: number[];       // tile indices opened (0..24)
  m3_score: number;
  m3_done: boolean;

  // Mode 4
  m4_opened: number[];       // property indices opened (0..4)
  m4_score: number;
  m4_done: boolean;

  current_mode: 1 | 2 | 3 | 4 | 5; // 5 = finished
};

export type Attempt = {
  id: string;
  set_id: string;
  player_name: string;
  mode1_score: number;
  mode2_score: number;
  mode3_score: number;
  mode4_score: number;
  total_score: number;
  finished: boolean;
  progress: AttemptProgress;
  started_at: string;
  finished_at: string | null;
};

export const initialProgress = (): AttemptProgress => ({
  m1_index: 0,
  m1_score: 0,
  m1_done: false,
  m1_results: [],
  m2_revealed_choices: false,
  m2_eliminated: 0,
  m2_score: 0,
  m2_done: false,
  m2_eliminated_indices: [],
  m3_opened: [],
  m3_score: 0,
  m3_done: false,
  m4_opened: [],
  m4_score: 0,
  m4_done: false,
  current_mode: 1,
});
