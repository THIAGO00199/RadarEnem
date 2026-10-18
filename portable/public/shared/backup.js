/* One portable copy of the student's local data; never sends it to a server. */
(function (root) {
  "use strict";
  const keys = ["kalore-hub-v3", "kalore-hub-v2", "atena-workspace-v1", "atena-scores-v1", "kalore-radar-v2", "radar-enem-v1", "kalore-essay-brief-v1", "kalore-color-theme", "kalore-motion"];
  const checkpoint = "atena-restore-point-v1";
  const limit = 12_000_000;
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  function validate(value) {
    if (!object(value) || value.app !== "ATENA" || value.kind !== "full-backup" || value.version !== 1 || !object(value.data)) throw Error("Escolha um backup completo ATENA válido.");
    if (JSON.stringify(value).length > limit) throw Error("Backup acima de 12 MB.");
    for (const [key, raw] of Object.entries(value.data)) {
      if (!keys.includes(key) || typeof raw !== "string") throw Error("O backup contém dados não reconhecidos.");
      if (key === "kalore-color-theme") {
        if (!["dark", "light"].includes(raw)) throw Error("Tema inválido no backup.");
      } else if (key === "kalore-motion") {
        if (!["true", "false"].includes(raw)) throw Error("Preferência inválida no backup.");
      } else if (!object(JSON.parse(raw))) throw Error("Dados inválidos no backup: " + key);
    }
    return value;
  }
  function create(storage = root.localStorage) {
    const data = {};
    for (const key of keys) {
      const value = storage.getItem(key);
      if (value !== null) data[key] = value;
    }
    // Export raw values even if one is corrupt: a recovery copy must not discard text.
    return { app: "ATENA", kind: "full-backup", version: 1, exportedAt: new Date().toISOString(), data };
  }
  function restore(value, storage = root.localStorage, keepCheckpoint = true) {
    validate(value); // No writes before the complete file has passed validation.
    const before = create(storage);
    const previousCheckpoint = storage.getItem(checkpoint);
    // If reserving the recovery copy fails, leave every existing key untouched.
    if (keepCheckpoint) {
      try { storage.setItem(checkpoint, JSON.stringify(before)); }
      catch { throw Error("O navegador recusou a importação. Os dados anteriores foram preservados."); }
    }
    try {
      // Remove only ATENA keys, freeing space before replacing their values.
      for (const key of keys) storage.removeItem(key);
      for (const [key, raw] of Object.entries(value.data)) storage.setItem(key, raw);
    } catch (error) {
      try {
        for (const key of keys) storage.removeItem(key);
        if (previousCheckpoint === null) storage.removeItem(checkpoint);
        else storage.setItem(checkpoint, previousCheckpoint);
        for (const [key, raw] of Object.entries(before.data)) storage.setItem(key, raw);
      } catch {
        throw Error("Não foi possível concluir a restauração. Mantenha a página aberta e exporte seus dados.");
      }
      throw Error("O navegador recusou a importação. Os dados anteriores foram preservados.", { cause: error });
    }
    return true;
  }
  function undo(storage = root.localStorage) {
    const raw = storage.getItem(checkpoint);
    if (!raw) throw Error("Ainda não existe uma importação para desfazer.");
    restore(JSON.parse(raw), storage, false);
    storage.removeItem(checkpoint);
  }
  const api = { keys, validate, create, restore, undo };
  root.AtenaBackup = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
