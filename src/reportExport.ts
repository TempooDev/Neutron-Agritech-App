import type { ReportItem } from "./data"

// Builds real, openable report files (PDF, XLSX, CSV) in the browser without
// external dependencies.

type Cell = string | number

const MIME_TYPES: Record<ReportItem["format"], string> = {
  PDF: "application/pdf",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  CSV: "text/csv;charset=utf-8",
}

const SUMMARY =
  "Se ha analizado la eficiencia hídrica y trazabilidad de los sectores monitorizados. Todas las lecturas cumplen con el Real Decreto de Nutrición y Uso Sostenible de Suelos."

const TABLE_HEADER: Cell[] = [
  "Sector",
  "Cultivo",
  "Consumo (m³)",
  "Eficiencia (%)",
  "Estado",
]

const TABLE_ROWS: Cell[][] = [
  ["Sector Norte", "Olivar", 1240, 92, "Conforme"],
  ["Sector Sur", "Almendro", 980, 88, "Conforme"],
  ["Sector Este", "Viñedo", 760, 85, "Conforme"],
  ["Sector Oeste", "Cítricos", 1515, 79, "Revisar"],
]

function metadataRows(rep: ReportItem): [string, string][] {
  return [
    ["Informe", rep.name],
    ["Fecha", rep.date],
    ["Tipo", rep.type],
    ["Explotación", rep.farm],
    ["Periodo", rep.period],
  ]
}

export function reportFileName(rep: ReportItem) {
  const base = rep.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `${base || "informe"}.${rep.format.toLowerCase()}`
}

export function buildReportBlob(rep: ReportItem): Blob {
  const bytes =
    rep.format === "PDF"
      ? buildPdf(rep)
      : rep.format === "XLSX"
        ? buildXlsx(rep)
        : buildCsv(rep)
  return new Blob([bytes], { type: MIME_TYPES[rep.format] })
}

export function downloadReport(rep: ReportItem) {
  const url = URL.createObjectURL(buildReportBlob(rep))
  const a = document.createElement("a")
  a.href = url
  a.download = reportFileName(rep)
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------------------------------------------------------------- CSV

function buildCsv(rep: ReportItem): Uint8Array<ArrayBuffer> {
  const escape = (v: Cell) => {
    const s = String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    ...metadataRows(rep).map((r) => r.map(escape).join(";")),
    "",
    TABLE_HEADER.map(escape).join(";"),
    ...TABLE_ROWS.map((r) => r.map(escape).join(";")),
  ]
  // BOM so Excel detects UTF-8 accents.
  return new TextEncoder().encode("﻿" + lines.join("\r\n") + "\r\n")
}

// ---------------------------------------------------------------- PDF

// Standard PDF fonts use WinAnsiEncoding, so text must be Latin-1.
function toLatin1(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x00-\xFF]/g, "?")
}

function pdfString(text: string) {
  return `(${toLatin1(text).replace(/([\\()])/g, "\\$1")})`
}

function wrap(text: string, maxChars: number) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

function buildPdf(rep: ReportItem): Uint8Array<ArrayBuffer> {
  const ops: string[] = []
  const text = (x: number, y: number, size: number, bold: boolean, s: string) =>
    ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td ${pdfString(s)} Tj ET`,
    )

  // Header band
  ops.push("0.18 0.42 0.25 rg 0 772 595 70 re f")
  ops.push("1 1 1 rg")
  text(50, 812, 16, true, "INFORME AGRONÓMICO OFICIAL")
  text(50, 792, 11, false, "Cooperativa Valle Verde · Neutron Agritech")
  ops.push("0 0 0 rg")

  let y = 740
  text(50, y, 14, true, rep.name)
  y -= 28
  for (const [label, value] of metadataRows(rep).slice(1)) {
    text(50, y, 10, true, `${label}:`)
    text(140, y, 10, false, value)
    y -= 16
  }

  y -= 14
  text(50, y, 12, true, "Resumen ejecutivo")
  y -= 18
  for (const line of wrap(SUMMARY, 95)) {
    text(50, y, 10, false, line)
    y -= 14
  }

  y -= 20
  text(50, y, 12, true, "Detalle por sector")
  y -= 10
  const cols = [50, 160, 260, 370, 470]
  const rowH = 20
  const drawRow = (row: Cell[], header: boolean) => {
    if (header)
      ops.push(`0.9 0.94 0.9 rg 45 ${y - rowH + 5} 505 ${rowH} re f 0 0 0 rg`)
    row.forEach((cell, i) => text(cols[i], y - 9, 10, header, String(cell)))
    ops.push(`0.75 G 45 ${y - rowH + 5} m 550 ${y - rowH + 5} l S`)
    y -= rowH
  }
  drawRow(TABLE_HEADER, true)
  TABLE_ROWS.forEach((r) => drawRow(r, false))

  text(
    50,
    50,
    8,
    false,
    `Documento generado por Neutron Agritech · ${rep.date}`,
  )

  const stream = ops.join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Title ${pdfString(rep.name)} /Producer (Neutron Agritech) >>`,
  ]

  // Every character is one Latin-1 byte, so string length == byte offset.
  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets
    .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
    .join("")
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return bytes
}

// ---------------------------------------------------------------- XLSX

function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function columnName(index: number) {
  let name = ""
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  }
  return name
}

function sheetXml(rows: Cell[][], boldRows: Set<number>) {
  const body = rows
    .map((row, r) => {
      const style = boldRows.has(r) ? ' s="1"' : ""
      const cells = row
        .map((v, c) => {
          const ref = `${columnName(c)}${r + 1}`
          return typeof v === "number"
            ? `<c r="${ref}"${style}><v>${v}</v></c>`
            : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`
        })
        .join("")
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join("")
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="18" customWidth="1"/><col min="2" max="5" width="34" customWidth="1"/></cols><sheetData>${body}</sheetData></worksheet>`
}

function buildXlsx(rep: ReportItem): Uint8Array<ArrayBuffer> {
  const rows: Cell[][] = [
    ...metadataRows(rep),
    [],
    ["Resumen ejecutivo", SUMMARY],
    [],
    TABLE_HEADER,
    ...TABLE_ROWS,
  ]
  const headerRow = rows.indexOf(TABLE_HEADER)

  const files: [string, string][] = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Informe" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      "xl/styles.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    ],
    ["xl/worksheets/sheet1.xml", sheetXml(rows, new Set([headerRow]))],
  ]
  return zipStore(files)
}

// Minimal ZIP writer (stored, no compression) — enough for an .xlsx package.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipStore(files: [string, string][]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const local: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const crc = crc32(data)

    const header = new Uint8Array(30 + nameBytes.length)
    const h = new DataView(header.buffer)
    h.setUint32(0, 0x04034b50, true)
    h.setUint16(4, 20, true)
    h.setUint16(6, 0x0800, true) // UTF-8 names
    h.setUint16(8, 0, true) // stored
    h.setUint16(10, 0, true)
    h.setUint16(12, 0x21, true) // 1980-01-01
    h.setUint32(14, crc, true)
    h.setUint32(18, data.length, true)
    h.setUint32(22, data.length, true)
    h.setUint16(26, nameBytes.length, true)
    header.set(nameBytes, 30)

    const entry = new Uint8Array(46 + nameBytes.length)
    const e = new DataView(entry.buffer)
    e.setUint32(0, 0x02014b50, true)
    e.setUint16(4, 20, true)
    e.setUint16(6, 20, true)
    e.setUint16(8, 0x0800, true)
    e.setUint16(10, 0, true)
    e.setUint16(12, 0, true)
    e.setUint16(14, 0x21, true)
    e.setUint32(16, crc, true)
    e.setUint32(20, data.length, true)
    e.setUint32(24, data.length, true)
    e.setUint16(28, nameBytes.length, true)
    e.setUint32(42, offset, true)
    entry.set(nameBytes, 46)

    local.push(header, data)
    central.push(entry)
    offset += header.length + data.length
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array(22)
  const d = new DataView(end.buffer)
  d.setUint32(0, 0x06054b50, true)
  d.setUint16(8, files.length, true)
  d.setUint16(10, files.length, true)
  d.setUint32(12, centralSize, true)
  d.setUint32(16, offset, true)

  const parts = [...local, ...central, end]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}
