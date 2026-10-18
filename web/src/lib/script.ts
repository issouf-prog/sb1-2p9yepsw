// Scénario : import (.fountain .txt .fdx .docx), types de ligne, export (.fountain .fdx .docx, impression PDF).
// Le texte de travail est un scénario en texte brut, compatible Fountain : blocs séparés par une ligne vide.

export type LineType = "scene" | "action" | "character" | "parenthetical" | "dialogue" | "transition";
export type ScriptLine = { type: LineType; text: string };

export const SCRIPT_ACCEPT = ".fountain,.txt,.fdx,.docx";
export const SCRIPT_MAX_BYTES = 2 * 1024 * 1024;

export class ScriptImportError extends Error {}

const SCENE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[. ]/i;
const TRANSITION = /^[A-ZÀ-Ý0-9 .'’-]+(TO:|AU NOIR\.?|AU BLANC\.?|ENCHAÎNÉ\.?|CUT\.?)$/;
const isCaps = (s: string) => /\p{L}/u.test(s) && s === s.toLocaleUpperCase("fr") && s.length <= 48;

/** Découpe un scénario en lignes typées (en-têtes de scène, action, personnage, didascalie, dialogue, transition). */
export function classify(text: string): ScriptLine[] {
  const out: ScriptLine[] = [];
  for (const block of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [first, ...rest] = lines;
    if (SCENE.test(first) && !rest.length) { out.push({ type: "scene", text: first.toLocaleUpperCase("fr") }); continue; }
    if (TRANSITION.test(first) && !rest.length) { out.push({ type: "transition", text: first }); continue; }
    if (isCaps(first) && rest.length && !SCENE.test(first)) {
      out.push({ type: "character", text: first });
      for (const l of rest) out.push({ type: l.startsWith("(") ? "parenthetical" : "dialogue", text: l });
      continue;
    }
    if (SCENE.test(first)) { out.push({ type: "scene", text: first.toLocaleUpperCase("fr") }); lines.shift(); }
    if (lines.length) out.push({ type: "action", text: lines.join("\n") });
  }
  return out;
}

/** Recompose le texte de travail à partir des lignes typées. */
export function joinLines(lines: ScriptLine[]): string {
  const parts: string[] = [];
  for (const l of lines) {
    const glued = l.type === "dialogue" || l.type === "parenthetical";
    if (glued && parts.length) parts[parts.length - 1] += `\n${l.text}`;
    else parts.push(l.text);
  }
  return parts.join("\n\n");
}

export function fromFountain(src: string): string {
  let t = src.replace(/\r\n?/g, "\n").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\[\[[\s\S]*?\]\]/g, "");
  // Page de titre : lignes « Clé: valeur » au début, jusqu'à la première ligne vide.
  if (/^[A-Za-z ]+:/.test(t)) t = t.replace(/^[\s\S]*?\n\s*\n/, "");
  const lines = t.split("\n").flatMap((raw) => {
    const l = raw.trimEnd();
    if (/^\s*(#|=)/.test(l)) return []; // sections, synopsis, sauts de page
    if (/^\s*>.*<\s*$/.test(l)) return [l.replace(/^\s*>\s*|\s*<\s*$/g, "")];
    return [l.replace(/^\s*[!@>~]\s*/, "").replace(/^\s*\.(?!\.)/, "")];
  });
  return lines.join("\n").replace(/\*{1,3}|_/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

const FDX_TYPE: Record<string, LineType> = {
  "Scene Heading": "scene", Action: "action", General: "action", Character: "character",
  Parenthetical: "parenthetical", Dialogue: "dialogue", Transition: "transition", Shot: "scene",
};

export function fromFdx(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new ScriptImportError("Ce fichier Final Draft est illisible.");
  const lines: ScriptLine[] = [];
  doc.querySelectorAll("Content > Paragraph").forEach((p) => {
    const text = Array.from(p.querySelectorAll("Text")).map((n) => n.textContent ?? "").join("").trim();
    if (!text) return;
    const type = FDX_TYPE[p.getAttribute("Type") ?? ""] ?? "action";
    lines.push({ type, text: type === "scene" || type === "character" ? text.toLocaleUpperCase("fr") : text });
  });
  return joinLines(lines);
}

/** Lit un fichier d'une archive zip (pour .docx), sans dépendance : répertoire central + DecompressionStream. */
async function unzipEntry(buf: ArrayBuffer, name: string): Promise<string | null> {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return null;
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let k = 0; k < count; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) return null;
    const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
    const nLen = v.getUint16(p + 28, true), xLen = v.getUint16(p + 30, true), cLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const entry = dec.decode(new Uint8Array(buf, p + 46, nLen));
    p += 46 + nLen + xLen + cLen;
    if (entry !== name) continue;
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const raw = new Uint8Array(buf, start, size);
    if (method === 0) return dec.decode(raw);
    if (method !== 8) return null;
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return await new Response(stream).text();
  }
  return null;
}

const DOCX_STYLE: Record<string, LineType> = {
  sceneheading: "scene", action: "action", character: "character", parenthetical: "parenthetical", dialogue: "dialogue", transition: "transition",
};

export async function fromDocx(buf: ArrayBuffer): Promise<string> {
  const xml = await unzipEntry(buf, "word/document.xml");
  if (!xml) throw new ScriptImportError("Ce fichier Word est illisible.");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const paras = Array.from(doc.getElementsByTagNameNS(W, "p")).map((p) => {
    let text = "";
    p.querySelectorAll("*").forEach((n) => {
      if (n.namespaceURI !== W) return;
      if (n.localName === "t") text += n.textContent ?? "";
      else if (n.localName === "tab") text += " ";
      else if (n.localName === "br") text += "\n";
    });
    const style = p.getElementsByTagNameNS(W, "pStyle")[0]?.getAttributeNS(W, "val") ?? p.getElementsByTagNameNS(W, "pStyle")[0]?.getAttribute("w:val") ?? "";
    return { text: text.trim(), type: DOCX_STYLE[style.toLowerCase().replace(/[^a-z]/g, "")] };
  });
  // Styles de scénario connus : on les suit. Sinon, chaque paragraphe Word devient un bloc.
  if (paras.some((p) => p.type)) return joinLines(paras.filter((p) => p.text).map((p) => ({ type: p.type ?? "action", text: p.text })));
  return paras.map((p) => p.text).join("\n").replace(/\n{3,}/g, "\n\n").replace(/([^\n])\n(?=(INT|EXT)[. ])/g, "$1\n\n").trim();
}

/** Lit un fichier de scénario choisi par l'utilisateur et renvoie le texte de travail. */
export async function readScriptFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (file.size > SCRIPT_MAX_BYTES) throw new ScriptImportError("Fichier trop lourd (2 Mo au plus).");
  if (ext === "pdf") throw new ScriptImportError("Le PDF n'est pas encore pris en charge : exportez votre scénario en .fountain, .fdx, .docx ou .txt.");
  let text: string;
  if (ext === "fountain" || ext === "txt") text = fromFountain(await file.text());
  else if (ext === "fdx") text = fromFdx(await file.text());
  else if (ext === "docx") text = await fromDocx(await file.arrayBuffer());
  else throw new ScriptImportError("Format non pris en charge. Formats acceptés : .fountain, .fdx, .docx, .txt.");
  if (!text.trim()) throw new ScriptImportError("Aucun texte trouvé dans ce fichier.");
  return text;
}

// ---------- Export ----------

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function toFountain(text: string, title: string): string {
  return `Title: ${title}\n\n${text.trim()}\n`;
}

export function toFdx(text: string): string {
  const NAME: Record<LineType, string> = { scene: "Scene Heading", action: "Action", character: "Character", parenthetical: "Parenthetical", dialogue: "Dialogue", transition: "Transition" };
  const body = classify(text).map((l) => `    <Paragraph Type="${NAME[l.type]}"><Text>${esc(l.text)}</Text></Paragraph>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<FinalDraft DocumentType="Script" Template="No" Version="5">\n  <Content>\n${body}\n  </Content>\n</FinalDraft>\n`;
}

// Mise en page de scénario classique, en twips (1 pouce = 1440).
const DOCX_LAYOUT: Record<LineType, string> = {
  scene: '<w:spacing w:before="240"/>',
  action: '<w:spacing w:before="240"/>',
  character: '<w:spacing w:before="240"/><w:ind w:left="3168"/>',
  parenthetical: '<w:ind w:left="2304" w:right="2880"/>',
  dialogue: '<w:ind w:left="1440" w:right="2160"/>',
  transition: '<w:spacing w:before="240"/><w:jc w:val="right"/>',
};

let crcTable: Uint32Array | null = null;
function crc32(b: Uint8Array) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let c = 0xffffffff;
  for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Archive zip sans compression (suffisant pour un .docx de quelques Ko). */
function zip(files: { name: string; data: string }[]): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    chunks.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((s, b) => s + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, size, true); e.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, new Uint8Array(e.buffer)] as BlobPart[], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function toDocx(text: string, title: string): Blob {
  const run = (t: string, caps = false) => `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="24"/>${caps ? "<w:caps/>" : ""}</w:rPr>${t.split("\n").map((s, i) => `${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${esc(s)}</w:t>`).join("")}</w:r>`;
  const para = (l: ScriptLine) => `<w:p><w:pPr>${DOCX_LAYOUT[l.type]}</w:pPr>${run(l.text, l.type === "scene" || l.type === "character")}</w:p>`;
  const body = [`<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run(title, true)}</w:p>`, ...classify(text).map(para)].join("");
  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  return zip([
    { name: "[Content_Types].xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name: "_rels/.rels", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name: "word/document.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>` },
  ]);
}

/** Page HTML du scénario mise en forme, pour l'impression (« Enregistrer en PDF » du navigateur). */
export function toPrintHtml(text: string, title: string): string {
  const CSS: Record<LineType, string> = {
    scene: "margin-top:1.5em;text-transform:uppercase", action: "margin-top:1em", character: "margin:1em 0 0 2.2in;text-transform:uppercase",
    parenthetical: "margin-left:1.6in;margin-right:2in", dialogue: "margin-left:1in;margin-right:1.5in", transition: "margin-top:1em;text-align:right",
  };
  const body = classify(text).map((l) => `<p style="${CSS[l.type]}">${esc(l.text).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:letter;margin:1in 1in 1in 1.5in}body{font:12pt/1.2 "Courier New",monospace;color:#000}p{margin:0;white-space:pre-wrap}h1{font-size:12pt;text-align:center;text-transform:uppercase;margin:0 0 3em}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;
}

export function fileSlug(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "scenario";
}
