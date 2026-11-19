/** Browser-only, dependency-free XLSX writer for the React Category Master columns. */
const columns: Array<[string, string]> = [
  ["Category ID", "category_id"], ["Category Name", "category_name"],
  ["Subcategory ID", "subcategory_id"], ["Subcategory Name", "subcategory_name"],
  ["Item Category ID", "item_category_id"], ["Item Category Name", "item_category_name"],
  ["Item Subcategory ID", "item_subcategory_id"], ["Item Subcategory Name", "item_subcategory_name"],
  ["Item ID", "item_id"], ["Item Name", "item_name"],
];
const encoder = new TextEncoder();
const xmlEscape = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const col = (index: number) => { let s = ""; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
const u16 = (n: number) => [n & 255, (n >>> 8) & 255];
const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
const crc32 = (bytes: Uint8Array) => { let crc = 0xffffffff; for (const b of bytes) { crc ^= b; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; };
function zip(files: Array<[string, string]>): Blob {
  const parts: BlobPart[] = []; const central: number[] = []; let offset = 0;
  for (const [name, content] of files) {
    const filename = encoder.encode(name); const data = encoder.encode(content); const crc = crc32(data);
    const local = new Uint8Array([80,75,3,4,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(filename.length),0,0]);
    parts.push(local as BlobPart, filename as BlobPart, data as BlobPart);
    central.push(80,75,1,2,20,0,20,0,0,0,0,0,0,0,0,0,...u32(crc),...u32(data.length),...u32(data.length),...u16(filename.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...filename);
    offset += local.length + filename.length + data.length;
  }
  const end = [80,75,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(central.length),...u32(offset),0,0];
  return new Blob([...parts, new Uint8Array(central), new Uint8Array(end)], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
export function downloadCategoryMaster(rows: Array<Record<string, unknown>>) {
  downloadAdminWorkbook(rows, columns, "Category_Master.xlsx");
}

export function downloadAdminWorkbook(rows: Array<Record<string, unknown>>, columns: Array<[string, string]>, filename: string) {
  const sheetRows = [columns.map(([title]) => title), ...rows.map(row => columns.map(([, key]) => row[key]))];
  const body = sheetRows.map((cells, i) => `<row r="${i + 1}">${cells.map((value, j) => {
    const ref = `${col(j)}${i + 1}`;
    if (i > 0 && typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${i === 0 ? ' s="1"' : ""}><is><t>${xmlEscape(value)}</t></is></c>`;
  }).join("")}</row>`).join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columns.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="24" customWidth="1"/>`).join("")}</cols><sheetData>${body}</sheetData></worksheet>`;
  const files: Array<[string,string]> = [
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ["xl/styles.xml", '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/></font><font><b/><sz val="11"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>'],
    ["xl/worksheets/sheet1.xml", sheet],
  ];
  const url = URL.createObjectURL(zip(files)); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
