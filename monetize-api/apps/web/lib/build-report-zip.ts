/** Demo-grade zip download: separate artifact files, store-only (no compression). */

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
    crc = CRC_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number): number[] {
  return [...u16(value & 0xffff), ...u16((value >>> 16) & 0xffff)];
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

export function buildReportZipBlob(files: Record<string, string>): Blob {
  const entries = selectZipEntries(files);
  const localParts: number[] = [];
  const centralParts: number[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = encoder.encode(name);
    const dataBytes = encoder.encode(content);
    const checksum = crc32(dataBytes);

    const localHeader = [
      0x50,
      0x4b,
      0x03,
      0x04,
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(checksum),
      ...u32(dataBytes.length),
      ...u32(dataBytes.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...nameBytes,
      ...dataBytes,
    ];

    localParts.push(...localHeader);

    const centralHeader = [
      0x50,
      0x4b,
      0x01,
      0x02,
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(checksum),
      ...u32(dataBytes.length),
      ...u32(dataBytes.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...nameBytes,
    ];

    centralParts.push(...centralHeader);
    offset += localHeader.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.length;
  const endRecord = [
    0x50,
    0x4b,
    0x05,
    0x06,
    ...u16(0),
    ...u16(0),
    ...u16(Object.keys(entries).length),
    ...u16(Object.keys(entries).length),
    ...u32(centralSize),
    ...u32(centralOffset),
    ...u16(0),
  ];

  const bytes = new Uint8Array([
    ...localParts,
    ...centralParts,
    ...endRecord,
  ]);

  return new Blob([bytes], { type: "application/zip" });
}
