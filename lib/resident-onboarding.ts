export function parseResidentCsv(text: string): Record<string, string>[] {
 const rows: string[][] = [];
 let row: string[] = [];
 let cell = "";
 let quoted = false;
 for (let i = 0; i < text.length; i += 1) {
 const char = text[i];
 if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
 else if (char === '"') quoted = !quoted;
 else if (char === "," && !quoted) { row.push(cell); cell = ""; }
 else if ((char === "\n" || char === "\r") && !quoted) {
 if (char === "\r" && text[i + 1] === "\n") i += 1;
 row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
 row = []; cell = "";
 } else cell += char;
 }
 if (cell || row.length) { row.push(cell); if (row.some((value) => value.trim())) rows.push(row); }
 const headers = (rows.shift() ?? []).map((value) => value.trim().toLowerCase());
 return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])));
}
