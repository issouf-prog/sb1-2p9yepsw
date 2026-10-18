// Génère src/styles/tokens.css (et une copie dans replica/design/) depuis replica/design/tokens.json.
// À relancer après chaque changement de tokens : npm run tokens
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const t = JSON.parse(readFileSync(resolve(root, "replica/design/tokens.json"), "utf8"));
const px = (n) => `${n / 16}rem`;
const lines = ["/* Généré par scripts/tokens-to-css.mjs depuis replica/design/tokens.json. Ne pas modifier à la main. */", "@theme {"];

for (const [name, value] of Object.entries(t.color)) lines.push(`  --color-${name}: ${value};`);
lines.push(`  --font-sans: ${t.font.sans};`, `  --font-mono: ${t.font.mono};`);
for (const [name, s] of Object.entries(t.type)) {
  lines.push(`  --text-${name}: ${px(s.size)};`, `  --text-${name}--line-height: ${px(s.line)};`);
  if (s.weight) lines.push(`  --text-${name}--font-weight: ${s.weight};`);
  if (s.tracking) lines.push(`  --text-${name}--letter-spacing: ${s.tracking};`);
}
for (const [name, r] of Object.entries(t.radius)) lines.push(`  --radius-${name}: ${r === 999 ? "9999px" : px(r)};`);
for (const [name, s] of Object.entries(t.shadow)) lines.push(`  --shadow-${name}: ${s};`);
lines.push(`  --ease-out: ${t.motion.ease};`);
for (const [name, v] of Object.entries(t.motion)) if (name !== "ease") lines.push(`  --duration-${name}: ${v};`);
for (const [name, v] of Object.entries(t.layout)) if (typeof v === "number") lines.push(`  --size-${name}: ${px(v)};`);
lines.push("}", "");

const css = lines.join("\n");
writeFileSync(resolve(root, "web/src/styles/tokens.css"), css);
writeFileSync(resolve(root, "replica/design/tokens.css"), css);
console.log(`tokens.css : ${Object.keys(t.color).length} couleurs, ${Object.keys(t.type).length} tailles de texte`);
