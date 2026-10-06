import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import vm from "node:vm";
const source = await readFile("lib/academy-data.ts", "utf8"),
  sandbox = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  sandbox,
);
await writeFile(
  "portable/public/hub/academy-data.js",
  "globalThis.AtenaAcademy=" + JSON.stringify(sandbox.exports.academy) + ";\n",
);
for (const script of ["build-materials.mjs", "build-essay-ideas.mjs"])
  execFileSync(process.execPath, ["scripts/" + script], { stdio: "inherit" });
const domain = await readFile("docs/CNAME", "utf8").catch(() =>
  readFile("portable/public/CNAME", "utf8").catch(() => ""),
);
await rm("public", { recursive: true, force: true });
await mkdir("public", { recursive: true });
await cp("portable/public", "public", { recursive: true });
if (domain.trim()) await writeFile("public/CNAME", domain.trim() + "\n");
await writeFile("public/.nojekyll", "");
