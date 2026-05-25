/** Store-only ZIP (PKZIP) — separate artifact files for macOS/Windows unzip. */

const ZIP_FILES = [
  "monetization-report.md",
  "ceiba-policy.json",
  "mcp-tool.json",
  "x402-payment.json",
  "docs.md",
  "launch-checklist.md",
  "paid-call-simulation.json",
  "paid-call-simulation.md",
] as const;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC_TABLE[(crc ^ data[index]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();

export function selectZipEntries(files: Record<string, string>): Record<string, string> {
  const selected: Record<string, string> = {};
  for (const name of ZIP_FILES) {
    const content = files[name];
    if (typeof content === "string" && content.length > 0) {
      selected[name] = content;
    }
  }
  if (Object.keys(selected).length === 0) {
    for (const [name, content] of Object.entries(files)) {
      if (name.endsWith(".md") || name.endsWith(".json")) {
        selected[name] = content;
      }
    }
  }
  return selected;
}

function writeLocalFileHeader(
  nameBytes: Uint8Array,
  dataBytes: Uint8Array,
  checksum: number,
): Uint8Array {
  const buffer = new Uint8Array(30 + nameBytes.length + dataBytes.length);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, checksum, true);
  view.setUint32(18, dataBytes.length, true);
  view.setUint32(22, dataBytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);

  buffer.set(nameBytes, 30);
  buffer.set(dataBytes, 30 + nameBytes.length);
  return buffer;
}

function writeCentralDirectoryEntry(
  nameBytes: Uint8Array,
  checksum: number,
  size: number,
  offset: number,
): Uint8Array {
  const buffer = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, checksum, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);

  buffer.set(nameBytes, 46);
  return buffer;
}

function writeEndOfCentralDirectory(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
): Uint8Array {
  const buffer = new Uint8Array(22);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);

  return buffer;
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Binary zip bytes (valid PKZIP store). */
export function buildReportZipBytes(files: Record<string, string>): Uint8Array {
  const entries = selectZipEntries(files);
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = encoder.encode(name);
    const dataBytes = encoder.encode(content);
    const checksum = crc32(dataBytes);

    const local = writeLocalFileHeader(nameBytes, dataBytes, checksum);
    localChunks.push(local);

    centralChunks.push(
      writeCentralDirectoryEntry(nameBytes, checksum, dataBytes.length, offset),
    );
    offset += local.length;
  }

  const centralDirectory = concatUint8Arrays(centralChunks);
  const centralOffset = offset;
  const endRecord = writeEndOfCentralDirectory(
    Object.keys(entries).length,
    centralDirectory.length,
    centralOffset,
  );

  return concatUint8Arrays([...localChunks, centralDirectory, endRecord]);
}

export function buildReportZipBlob(files: Record<string, string>): Blob {
  const bytes = buildReportZipBytes(files);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/zip" });
}
