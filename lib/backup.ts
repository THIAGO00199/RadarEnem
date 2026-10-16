import "../portable/public/shared/backup.js";
export type FullBackup = {
  app: "ATENA";
  kind: "full-backup";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
};
export const backup = (globalThis as unknown as {
  AtenaBackup: {
    create(): FullBackup;
    restore(value: unknown): boolean;
    undo(): void;
  };
}).AtenaBackup;
