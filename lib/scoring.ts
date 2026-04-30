// Scoring helpers — keep server and client logic consistent

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function answerMatches(playerAnswer: string, correct: string): boolean {
  if (!correct) return false;
  return normalizeAnswer(playerAnswer) === normalizeAnswer(correct);
}

// Mode 2: 25 → 20 → 15 → 10 → 5 (and 0 if wrong)
export function mode2Score(eliminated: number, revealedChoices: boolean): number {
  if (!revealedChoices) return 25;
  // revealed = base 20, then -5 per elimination
  const s = 20 - eliminated * 5;
  return Math.max(s, 5);
}

// Mode 3: open 1 = 25, each additional opening reduces 5, floor 0
export function mode3Score(openedCount: number): number {
  // openedCount must be >= 1 (must open at least 1)
  return Math.max(0, 25 - (openedCount - 1) * 5);
}

// Mode 4: open 1 = 25, each additional = -5; openedCount in 1..5 → 25/20/15/10/5
export function mode4Score(openedCount: number): number {
  return Math.max(0, 25 - (openedCount - 1) * 5);
}
