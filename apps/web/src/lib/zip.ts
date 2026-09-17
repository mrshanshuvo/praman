/**
 * Pure TypeScript, zero-dependency in-memory PKZIP archive generator (RFC 1950 / PKZIP 2.0).
 * Creates valid, uncompressed (STORE) .zip files that natively open on Windows, macOS, and Linux.
 */

// CRC-32 Table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  filename: string;
  data: string | Uint8Array;
}

export function createZipArchive(files: Record<string, string | Uint8Array>): Uint8Array {
  const encoder = new TextEncoder();
  const fileEntries: Array<{
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  const parts: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Local File Headers and Data
  for (const [filename, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(filename);
    const contentBytes = typeof content === 'string' ? encoder.encode(content) : content;
    const crc = calculateCrc32(contentBytes);

    fileEntries.push({
      nameBytes,
      contentBytes,
      crc,
      offset: currentOffset,
    });

    const localHeader = new Uint8Array(30);
    const dv = new DataView(localHeader.buffer);

    dv.setUint32(0, 0x04034b50, true); // Local header signature
    dv.setUint16(4, 20, true); // Version needed (2.0)
    dv.setUint16(6, 0, true); // General flags
    dv.setUint16(8, 0, true); // Compression (0 = STORE)
    dv.setUint16(10, 0, true); // Mod time
    dv.setUint16(12, 0, true); // Mod date
    dv.setUint32(14, crc, true); // CRC-32
    dv.setUint32(18, contentBytes.length, true); // Compressed size
    dv.setUint32(22, contentBytes.length, true); // Uncompressed size
    dv.setUint16(26, nameBytes.length, true); // Filename length
    dv.setUint16(28, 0, true); // Extra field length

    parts.push(localHeader);
    parts.push(nameBytes);
    parts.push(contentBytes);

    currentOffset += 30 + nameBytes.length + contentBytes.length;
  }

  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  // 2. Central Directory
  for (const entry of fileEntries) {
    const centralHeader = new Uint8Array(46);
    const dv = new DataView(centralHeader.buffer);

    dv.setUint32(0, 0x02014b50, true); // Central header signature
    dv.setUint16(4, 20, true); // Version made by
    dv.setUint16(6, 20, true); // Version needed
    dv.setUint16(8, 0, true); // General flags
    dv.setUint16(10, 0, true); // Compression (0 = STORE)
    dv.setUint16(12, 0, true); // Mod time
    dv.setUint16(14, 0, true); // Mod date
    dv.setUint32(16, entry.crc, true); // CRC-32
    dv.setUint32(20, entry.contentBytes.length, true); // Compressed size
    dv.setUint32(24, entry.contentBytes.length, true); // Uncompressed size
    dv.setUint16(28, entry.nameBytes.length, true); // Filename length
    dv.setUint16(30, 0, true); // Extra length
    dv.setUint16(32, 0, true); // Comment length
    dv.setUint16(34, 0, true); // Disk start
    dv.setUint16(36, 0, true); // Internal attributes
    dv.setUint32(38, 0, true); // External attributes
    dv.setUint32(42, entry.offset, true); // Relative offset of local header

    parts.push(centralHeader);
    parts.push(entry.nameBytes);

    centralDirSize += 46 + entry.nameBytes.length;
  }

  // 3. End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const dvEocd = new DataView(eocd.buffer);

  dvEocd.setUint32(0, 0x06054b50, true); // EOCD signature
  dvEocd.setUint16(4, 0, true); // Disk number
  dvEocd.setUint16(6, 0, true); // Start disk
  dvEocd.setUint16(8, fileEntries.length, true); // Entries on this disk
  dvEocd.setUint16(10, fileEntries.length, true); // Total entries
  dvEocd.setUint32(12, centralDirSize, true); // Central directory size
  dvEocd.setUint32(16, centralDirStartOffset, true); // Central directory offset
  dvEocd.setUint16(20, 0, true); // Comment length

  parts.push(eocd);

  // Merge parts into single Uint8Array
  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}

export function triggerFileDownload(
  filename: string,
  content: string | Uint8Array,
  mimeType = 'application/octet-stream',
): void {
  const blob = new Blob([content as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadZip(filename: string, files: Record<string, string | Uint8Array>): void {
  const zipBuffer = createZipArchive(files);
  triggerFileDownload(filename, zipBuffer, 'application/zip');
}
