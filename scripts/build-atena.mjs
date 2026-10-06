import "./prepare-atena.mjs";
import { cp, rm, readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
});
await rm("docs", { recursive: true, force: true });
await cp("out", "docs", { recursive: true });
// CSS resolves URLs relative to its own directory, rather than the HTML route.
let fontAsset = "";
for (const name of await readdir("docs/_next/static/css"))
  if (name.endsWith(".css")) {
    const path = "docs/_next/static/css/" + name;
    const css = await readFile(path, "utf8");
    fontAsset ||=
      css.match(/_next\/static\/media\/(manrope[^)'"\s]+\.woff2)/)?.[1] || "";
    await writeFile(
      path,
      css.replace(
        /url\((['"]?)(?:\.\/)?_next\/static\/media\//g,
        "url($1../media/",
      ),
    );
  }
// Relative links support both the project URL and the custom domain.
// The preload must target the exact hashed font used by Next's stylesheet.
for (const name of await readdir("docs"))
  if (name.endsWith(".html")) {
    const path = "docs/" + name;
    let html = (await readFile(path, "utf8")).replaceAll(
      '"/_next/',
      '"./_next/',
    );
    if (fontAsset && name !== "estudar.html")
      html = html.replaceAll(
        'href="./shared/fonts/manrope-latin-variable.woff2"',
        'href="./_next/static/media/' + fontAsset + '"',
      );
    await writeFile(path, html);
  }
await writeFile("docs/.nojekyll", "");
execFileSync(process.execPath, ["scripts/build-standalone.mjs"], {
  stdio: "inherit",
});
execFileSync(process.execPath, ["scripts/build-offline.mjs"], {
  stdio: "inherit",
});
