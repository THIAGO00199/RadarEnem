export type Area = "mat" | "nat" | "hum" | "ling" | "red";
export type StudyTask = {
  id: string;
  area: Area;
  date: string;
  title: string;
  minutes: number;
  done: boolean;
  completedAt?: string | null;
  tab: string;
};
export type PersonalCard = {
  id: string;
  front: string;
  back: string;
  area: Area;
  stage: number;
  due: string;
};
export type Workspace = {
  version: 1;
  profile: {
    name: string;
    minutes: number;
    weeklyGoal: number;
    priority: Area;
  };
  weeks: Record<string, StudyTask[]>;
  cards: PersonalCard[];
  checklist: Record<string, boolean>;
};
export type StudyOverview = {
  answers: number;
  correct: number;
  accuracy: number | null;
  focus: number;
  essays: number;
  streak: number;
  days: { date: string; active: boolean; count: number }[];
  activeDays: number;
  completed: number;
  pending: number;
  name: string;
  xp: number;
};
declare global {
  interface Window {
    AtenaModel: {
      sanitize: (value: unknown) => Workspace;
      plan: (value: Workspace, now?: Date) => StudyTask[];
      overview: (hub: unknown, value: Workspace, now?: Date) => StudyOverview;
      day: (now?: Date) => string;
      monday: (now?: Date) => string;
      names: Record<Area, string>;
      essaySignals: (value: string) => {
        words: number;
        paragraphs: number;
        connectors: string[];
        longSentences: number;
        readingMinutes: number;
        hasText: boolean;
      };
    };
  }
}
export const WORKSPACE_KEY = "atena-workspace-v1";
export const atenaModel = (
  globalThis as unknown as { AtenaModel: Window["AtenaModel"] }
).AtenaModel;
export function readWorkspace(): Workspace {
  try {
    return atenaModel.sanitize(
      JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "null"),
    );
  } catch {
    return atenaModel.sanitize(null);
  }
}
export function readHub(): unknown {
  try {
    return JSON.parse(localStorage.getItem("kalore-hub-v3") || "null");
  } catch {
    return null;
  }
}
import "../portable/public/shared/atena-model.js";
