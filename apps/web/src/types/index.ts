/**
 * Shared domain types — mirrors the API contract. Zero `any`.
 */

export type ConceptStatus = "not_started" | "in_progress" | "gap_detected" | "mastered";

export type QuestionType = "mcq" | "short_answer" | "code" | "numeric";

export type SessionMode = "diagnostic" | "adaptive_practice" | "mastery_check";

export type Rating = "again" | "hard" | "good" | "easy";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  learningPreferences: Record<string, unknown>;
  currentAbilityVector: Record<string, number>;
  streak: { current: number; longest: number; freezesAvailable: number };
  xp: number;
  badges: Array<{ key: string; name: string; awardedAt: string }>;
}

export interface ConceptSummary {
  conceptId: string;
  conceptName: string;
  topicName: string;
  subjectName: string;
  masteryProbability: number;
  status: ConceptStatus;
  attemptsCount: number;
}

export interface LearningPathItem {
  conceptId: string;
  conceptName: string;
  topicName: string;
  subjectName: string;
  kind: "gap_remediation" | "new_content";
  score: number;
  rationale: string;
}

export interface LearningPathResponse {
  generatedAt: string;
  items: LearningPathItem[];
}

export interface PresentedQuestion {
  questionId: string;
  conceptId: string;
  type: QuestionType;
  body: string;
  choices: string[] | null;
  /** UI difficulty 1-10 */
  difficulty: number;
}

export interface AttemptFeedback {
  attemptId: string;
  isCorrect: boolean;
  updatedMastery: number;
  status: ConceptStatus;
  gapFlagged: boolean;
}

export interface DiagnosticStartResponse {
  sessionId: string;
  firstItem: PresentedQuestion;
  calibrationInfo: { message: string; maxItems: number };
}

export interface DiagnosticAnswerResponse {
  nextItem: PresentedQuestion | null;
  completed: boolean;
  calibration: { theta: number; se: number; itemsAdministered: number };
  lastAttempt: AttemptFeedback;
}

export interface QuizStartResponse {
  sessionId: string;
  firstItem: PresentedQuestion;
  seededTheta: number;
}

export interface QuizAnswerResponse {
  nextItem: PresentedQuestion | null;
  completed: boolean;
  lastAttempt: AttemptFeedback;
  intervention: boolean;
}

export interface HeatmapCell {
  conceptId: string;
  conceptName: string;
  topicName: string;
  subjectName: string;
  confidence: number;
  accuracy: number;
  attemptCount: number;
  lastAttemptedAt: string | null;
}

export interface MasteryHeatmapResponse {
  cells: HeatmapCell[];
  subjects: string[];
}

export interface ReviewItemDto {
  id: string;
  conceptId: string;
  conceptName: string;
  topicName: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueAt: string;
}

export interface ReviewDueResponse {
  dueCount: number;
  items: ReviewItemDto[];
}

export interface GapDto {
  conceptId: string;
  conceptName: string;
  observedOn: string;
  observedOnName: string;
  unexpected: boolean;
  depth: number;
}

export interface DetectedGapsResponse {
  gaps: GapDto[];
}

export interface BadgeDto {
  key: string;
  name: string;
  description?: string;
  awardedAt?: string;
}

export interface EducatorOverview {
  cohortId: string;
  studentCount: number;
  flaggedCount: number;
  students: Array<{
    studentId: string;
    name: string;
    avgMastery: number;
    openGapCount: number;
    flagged: boolean;
    gapConcepts: string[];
  }>;
}
