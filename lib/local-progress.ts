import { atenaModel, readHub } from "./atena";
export type HubRecord = Record<string, unknown> & {
  course?: {
    track?: string;
    done?: Record<string, boolean>;
    energy?: { date: string; value: number };
  };
  draft?: string;
  draftTheme?: string;
  essays?: {
    id: string;
    date: string;
    text: string;
    theme: string;
    themeIndex: number;
    diagnostic: number;
    blueprint?: Record<string, string>;
  }[];
  xp?: number;
  activity?: Record<string, number>;
  blueprint?: Record<string, string>;
};
export function currentHub(): HubRecord {
  const value = readHub();
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as HubRecord)
    : {};
}
export function updateHub(change: (value: HubRecord) => HubRecord): HubRecord {
  const next = change(currentHub());
  localStorage.setItem("kalore-hub-v3", JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("atena:progress"));
  return next;
}
export function markActivity(value: HubRecord): HubRecord {
  const key = atenaModel.day(),
    activity =
      value.activity && typeof value.activity === "object"
        ? value.activity
        : {};
  return {
    ...value,
    activity: { ...activity, [key]: (Number(activity[key]) || 0) + 1 },
  };
}
