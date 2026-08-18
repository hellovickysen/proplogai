import { createHash } from 'crypto';

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_FILE_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_ENTRIES = 2000;

function crc32(buffer) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function isSafePath(path) {
  return typeof path === 'string'
    && path.length > 0
    && path.length <= 240
    && !path.startsWith('/')
    && !path.includes('..')
    && /^[a-zA-Z0-9_./-]+$/.test(path);
}

function writeLocalHeader(name, content) {
  const nameBuffer = Buffer.from(name, 'utf8');
  const header = Buffer.alloc(30);
  const crc = crc32(content);
  header.writeUInt32LE(LOCAL_FILE_HEADER, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(content.length, 18);
  header.writeUInt32LE(content.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28);
  return { header, nameBuffer, crc };
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** Build a deliberately uncompressed ZIP archive. Avoiding compression prevents zip bombs and keeps server validation simple. */
export function createBackupZip(entries) {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > MAX_ENTRIES) {
    throw new Error('Invalid backup archive entry count.');
  }

  const parts = [];
  const directory = [];
  let offset = 0;

  for (const entry of entries) {
    if (!isSafePath(entry?.path)) throw new Error('Invalid backup archive path.');
    const content = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || '');
    if (content.length > MAX_ENTRY_BYTES) throw new Error('A backup file exceeds the per-file limit.');
    const { header, nameBuffer, crc } = writeLocalHeader(entry.path, content);
    parts.push(header, nameBuffer, content);
    directory.push({ nameBuffer, crc, size: content.length, offset });
    offset += header.length + nameBuffer.length + content.length;
  }

  const centralStart = offset;
  for (const item of directory) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(CENTRAL_FILE_HEADER, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt16LE(0, 14);
    header.writeUInt32LE(item.crc, 16);
    header.writeUInt32LE(item.size, 20);
    header.writeUInt32LE(item.size, 24);
    header.writeUInt16LE(item.nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(item.offset, 42);
    parts.push(header, item.nameBuffer);
    offset += header.length + item.nameBuffer.length;
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(directory.length, 8);
  end.writeUInt16LE(directory.length, 10);
  end.writeUInt32LE(offset - centralStart, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);
  parts.push(end);

  const archive = Buffer.concat(parts);
  if (archive.length > MAX_ARCHIVE_BYTES) throw new Error('Backup archive exceeds the 25MB local-download limit.');
  return archive;
}

function findEndOfCentralDirectory(buffer) {
  const minimum = Math.max(0, buffer.length - 65557);
  for (let index = buffer.length - 22; index >= minimum; index -= 1) {
    if (buffer.readUInt32LE(index) === END_OF_CENTRAL_DIRECTORY) return index;
  }
  return -1;
}

/** Parse store-only archives created by createBackupZip. Rejects compressed or path-traversal entries. */
export function readBackupZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22 || buffer.length > MAX_ARCHIVE_BYTES) {
    throw new Error('Backup archive is missing or exceeds the 25MB limit.');
  }
  const endOffset = findEndOfCentralDirectory(buffer);
  if (endOffset < 0) throw new Error('Backup archive is invalid.');

  const count = buffer.readUInt16LE(endOffset + 10);
  const centralSize = buffer.readUInt32LE(endOffset + 12);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  if (count === 0 || count > MAX_ENTRIES || centralOffset + centralSize > endOffset) {
    throw new Error('Backup archive directory is invalid.');
  }

  const files = new Map();
  let cursor = centralOffset;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== CENTRAL_FILE_HEADER) {
      throw new Error('Backup archive contains an invalid directory entry.');
    }
    const compression = buffer.readUInt16LE(cursor + 10);
    const crc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const size = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    if (compression !== 0 || compressedSize !== size || size > MAX_ENTRY_BYTES || nameEnd > buffer.length) {
      throw new Error('Backup archive contains an unsupported or oversized entry.');
    }
    const name = buffer.subarray(nameStart, nameEnd).toString('utf8');
    if (!isSafePath(name) || files.has(name)) throw new Error('Backup archive contains an unsafe duplicate path.');

    if (localOffset + 30 > buffer.length || buffer.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER) {
      throw new Error('Backup archive contains an invalid file entry.');
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + size;
    if (dataEnd > buffer.length) throw new Error('Backup archive is truncated.');
    const content = buffer.subarray(dataStart, dataEnd);
    if (crc32(content) !== crc) throw new Error('Backup archive checksum validation failed.');
    files.set(name, content);
    cursor = nameEnd + extraLength + commentLength;
  }
  return files;
}

export const BACKUP_LIMITS = {
  maxArchiveBytes: MAX_ARCHIVE_BYTES,
  maxEntryBytes: MAX_ENTRY_BYTES,
  maxEntries: MAX_ENTRIES,
};
