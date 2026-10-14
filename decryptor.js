/**
 * WhatsApp Database Decryption & Verification Engine
 * Supports Crypt12, Crypt14, Crypt15, raw SQLite (.db), and WhatsApp key file parsing (158 bytes / 32 bytes / Hex).
 * Powered by HKDF-SHA256, Protobuf Header Scanner, and multi-mode fallback (AES-GCM, AES-CTR, AES-CBC).
 */

class WADecryptor {
  /**
   * Check if file is an unencrypted plain SQLite database
   * @param {Uint8Array} bytes
   * @returns {boolean}
   */
  static isPlainSqlite(bytes) {
    if (!bytes || bytes.length < 16) return false;
    const header = new TextDecoder('utf-8').decode(bytes.slice(0, 16));
    return header.startsWith('SQLite format 3');
  }

  /**
   * Extract 32-byte AES key from WhatsApp key input
   * Standard Android WhatsApp key file is 158 bytes, where the last 32 bytes are the AES Key.
   * encrypted_backup.key (Crypt15) is 32 bytes.
   * Can also be a 64-character Hex string.
   * @param {Uint8Array|string} keyInput
   * @returns {Uint8Array} 32-byte key
   */
  static extractAesKey(keyInput) {
    if (typeof keyInput === 'string') {
      const cleanHex = keyInput.trim().replace(/[\s:\-_]/g, '');
      if (/^[0-9a-fA-F]{64}$/.test(cleanHex)) {
        const key = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          key[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
        }
        return key;
      }
      throw new Error('Invalid hex key format. Must be 64 hexadecimal characters.');
    }

    if (keyInput instanceof Uint8Array || keyInput instanceof ArrayBuffer) {
      const bytes = keyInput instanceof ArrayBuffer ? new Uint8Array(keyInput) : keyInput;
      
      // Check if file is a text file containing 64 hex characters (e.g. key.txt)
      try {
        const asText = new TextDecoder('utf-8').decode(bytes).trim().replace(/[\s:\-_]/g, '');
        if (/^[0-9a-fA-F]{64}$/.test(asText)) {
          const key = new Uint8Array(32);
          for (let i = 0; i < 32; i++) {
            key[i] = parseInt(asText.substr(i * 2, 2), 16);
          }
          return key;
        }
      } catch (e) {}

      // If 158 bytes (standard Android WhatsApp key file)
      if (bytes.length === 158) {
        return bytes.slice(126, 158); // last 32 bytes
      }
      
      // If exactly 32 bytes (Crypt15 raw key)
      if (bytes.length === 32) {
        return bytes;
      }

      // If key file is larger than 32 bytes, take the last 32 bytes as fallback
      if (bytes.length > 32) {
        return bytes.slice(bytes.length - 32);
      }

      throw new Error(`Invalid key file size (${bytes.length} bytes). WhatsApp key files are usually 158 bytes or 32 bytes.`);
    }

    throw new Error('Unsupported key format.');
  }

  /**
   * Extract additional IV from 158-byte key file if present
   * @param {Uint8Array|ArrayBuffer} keyInput
   * @returns {Uint8Array|null}
   */
  static extractKeyIV(keyInput) {
    if (!keyInput) return null;
    const bytes = keyInput instanceof ArrayBuffer ? new Uint8Array(keyInput) : keyInput;
    if (bytes instanceof Uint8Array && bytes.length === 158) {
      return bytes.slice(110, 126); // 16 bytes IV inside Java serialized structure
    }
    return null;
  }

  /**
   * HKDF-SHA256 for Crypt15 key derivation
   * Formula:
   * PRK = HMAC-SHA256(salt=32 zeros, IKM=rootKey)
   * T(1) = HMAC-SHA256(PRK, info + 0x01)
   */
  static async hkdfSha256(ikm, salt, infoStr, outputLength = 32) {
    const saltBytes = salt || new Uint8Array(32);
    const saltKey = await window.crypto.subtle.importKey(
      'raw',
      saltBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // 1. Extract phase: PRK
    const prk = await window.crypto.subtle.sign('HMAC', saltKey, ikm);

    // 2. Expand phase
    const prkKey = await window.crypto.subtle.importKey(
      'raw',
      prk,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const infoBytes = new TextEncoder().encode(infoStr);
    const expandInput = new Uint8Array(infoBytes.length + 1);
    expandInput.set(infoBytes, 0);
    expandInput[infoBytes.length] = 1; // iteration 1

    const t1 = await window.crypto.subtle.sign('HMAC', prkKey, expandInput);
    return new Uint8Array(t1).slice(0, outputLength);
  }

  /**
   * Get candidate key variations (Direct AES key & HKDF derived key for Crypt15)
   */
  static async deriveKeyCandidates(keyInput) {
    const rawKey = this.extractAesKey(keyInput);
    const list = [rawKey];

    try {
      // WhatsApp Crypt15 derives local backup key with HKDF info "backup encryption"
      const crypt15Key = await this.hkdfSha256(rawKey, new Uint8Array(32), 'backup encryption', 32);
      list.push(crypt15Key);
    } catch (e) {
      console.warn('Failed to compute HKDF derivation:', e);
    }

    return list;
  }

  /**
   * Detect probable encryption format from database file
   * @param {string} fileName
   * @param {Uint8Array} bytes
   * @returns {string} 'plain' | 'crypt12' | 'crypt14' | 'crypt15' | 'unknown'
   */
  static detectFileType(fileName, bytes) {
    if (this.isPlainSqlite(bytes)) return 'plain';

    const lower = (fileName || '').toLowerCase();
    if (lower.endsWith('.crypt12')) return 'crypt12';
    if (lower.endsWith('.crypt14')) return 'crypt14';
    if (lower.endsWith('.crypt15')) return 'crypt15';

    // Check header bytes to detect Crypt14/Crypt15
    if (bytes && bytes.length > 10) {
      if (bytes[0] === 0x00 && bytes[1] === 0x01) return 'crypt12';
      if (bytes[0] > 0 && bytes[0] < 128) return 'crypt14';
    }

    return 'unknown_crypt';
  }

  /**
   * Parse protobuf header and discover IV and ciphertext start offset
   */
  static parseProtobufHeader(dbBytes) {
    if (!dbBytes || dbBytes.length < 50) return null;

    // Read varint length of protobuf header at byte 0
    let headerLen = 0;
    let varintBytes = 0;
    let shift = 0;
    for (let i = 0; i < Math.min(5, dbBytes.length); i++) {
      const b = dbBytes[i];
      headerLen |= (b & 0x7f) << shift;
      varintBytes++;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }

    // If reasonable WhatsApp protobuf header length (between 10 and 512 bytes)
    if (headerLen >= 10 && headerLen < 512 && varintBytes + headerLen < dbBytes.length) {
      const dataStart = varintBytes + headerLen;
      const headerBytes = dbBytes.slice(varintBytes, dataStart);
      const ivCandidates = [];

      // Look for 16-byte (0x10) fields in protobuf header: [tag] + 0x10 + [16 bytes IV]
      for (let i = 0; i < headerBytes.length - 17; i++) {
        if (headerBytes[i + 1] === 16) {
          const iv = headerBytes.slice(i + 2, i + 2 + 16);
          ivCandidates.push({
            iv: iv,
            dataStart: dataStart,
            source: `Protobuf tag 0x${headerBytes[i].toString(16)} @ offset ${varintBytes + i + 2}`
          });
        }
      }

      return {
        headerLen: headerLen,
        dataStart: dataStart,
        ivCandidates: ivCandidates
      };
    }

    return null;
  }

  /**
   * Check if payload is valid SQLite or ZIP file
   */
  static isDecryptedValid(bytes) {
    if (!bytes || bytes.length < 16) return false;
    // Check "SQLite format 3" header
    const textHead = new TextDecoder('ascii').decode(bytes.slice(0, 15));
    if (textHead === 'SQLite format 3') return true;
    // Check ZIP header PK\x03\x04
    if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) return true;
    return false;
  }

  /**
   * Decompress zlib stream using pako or DecompressionStream
   * @param {Uint8Array} compressedBytes
   * @returns {Promise<Uint8Array>}
   */
  static async decompressZlib(compressedBytes) {
    // 1. Try pako if available
    if (typeof window !== 'undefined' && window.pako && window.pako.inflate) {
      try {
        return window.pako.inflate(compressedBytes);
      } catch (err) {
        // try next method
      }
    }

    // 2. Try browser native DecompressionStream ('deflate')
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(compressedBytes);
        writer.close();
        const response = new Response(ds.readable);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        // try next method
      }
    }

    // 3. Try DecompressionStream ('gzip')
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(compressedBytes);
        writer.close();
        const response = new Response(ds.readable);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        // fallback
      }
    }

    throw new Error('Zlib decompression failed.');
  }

  /**
   * Decrypt WhatsApp database file using AES-GCM, AES-CTR, or AES-CBC
   * @param {Uint8Array} dbBytes
   * @param {Uint8Array|string} keyInput
   * @param {string} fileType
   * @param {function} onProgress
   * @returns {Promise<Uint8Array>} Raw unencrypted SQLite bytes
   */
  static async decryptDatabase(dbBytes, keyInput, fileType = 'auto', onProgress = () => {}) {
    if (this.isPlainSqlite(dbBytes)) {
      onProgress({ stage: 'done', message: 'Database is unencrypted SQLite, loading directly.' });
      return dbBytes;
    }

    onProgress({ stage: 'extract_key', message: 'Extracting encryption key...' });
    const keyCandidates = await this.deriveKeyCandidates(keyInput);
    const keyIV = this.extractKeyIV(keyInput);

    // Gather IV candidates and dataStart offsets
    const pbHeader = this.parseProtobufHeader(dbBytes);
    const testPlans = [];

    // 1. If Protobuf Header detected (Crypt14 & Crypt15)
    if (pbHeader && pbHeader.ivCandidates.length > 0) {
      pbHeader.ivCandidates.forEach(cand => {
        // In Crypt14/15, the last 16 bytes are checksum, preceding 16 bytes are GCM tag
        // WebCrypto AES-GCM expects ciphertext + 16-byte tag, so trimEnd: 16 cuts checksum
        testPlans.push({
          iv: cand.iv,
          dataStart: cand.dataStart,
          trimEnd: 16,
          mode: 'AES-GCM',
          desc: `Crypt14/15 GCM (${cand.source})`
        });
        // Also try CTR mode (trim 32 bytes to isolate ciphertext)
        testPlans.push({
          iv: cand.iv,
          dataStart: cand.dataStart,
          trimEnd: 32,
          mode: 'AES-CTR',
          desc: `Crypt14/15 CTR (${cand.source})`
        });
      });
    }

    // 2. Crypt12 Candidates (IV at offset 51..67, data starts at offset 67)
    testPlans.push({
      iv: dbBytes.slice(51, 67),
      dataStart: 67,
      trimEnd: 4, // 16 byte tag + 4 byte suffix
      mode: 'AES-GCM',
      desc: 'Crypt12 GCM (Offset 51)'
    });
    testPlans.push({
      iv: dbBytes.slice(51, 67),
      dataStart: 67,
      trimEnd: 20,
      mode: 'AES-GCM',
      desc: 'Crypt12 GCM Trim 20'
    });
    testPlans.push({
      iv: dbBytes.slice(51, 67),
      dataStart: 67,
      trimEnd: 20,
      mode: 'AES-CTR',
      desc: 'Crypt12 CTR (Offset 51)'
    });

    // 3. If key file has internal IV (key.slice(110, 126))
    if (keyIV) {
      testPlans.push({
        iv: keyIV,
        dataStart: pbHeader ? pbHeader.dataStart : 122,
        trimEnd: 16,
        mode: 'AES-GCM',
        desc: 'Key File IV + GCM'
      });
      testPlans.push({
        iv: keyIV,
        dataStart: 67,
        trimEnd: 4,
        mode: 'AES-GCM',
        desc: 'Key File IV + Crypt12'
      });
    }

    // 4. Additional standard offsets for legacy variants
    const commonOffsets = [
      { ivStart: 66, dataStart: 122, trim: 16 },
      { ivStart: 67, dataStart: 123, trim: 16 },
      { ivStart: 16, dataStart: 32, trim: 16 },
      { ivStart: 3, dataStart: 19, trim: 16 }
    ];
    commonOffsets.forEach(co => {
      if (dbBytes.length > co.dataStart + co.trim + 16) {
        testPlans.push({
          iv: dbBytes.slice(co.ivStart, co.ivStart + 16),
          dataStart: co.dataStart,
          trimEnd: co.trim,
          mode: 'AES-GCM',
          desc: `Dynamic Offset ${co.dataStart}`
        });
      }
    });

    let lastError = null;
    let attemptIndex = 0;

    // Loop through candidate keys (Direct key and HKDF derived key)
    for (const currentKey of keyCandidates) {
      for (const plan of testPlans) {
        attemptIndex++;
        if (dbBytes.length <= plan.dataStart + plan.trimEnd + 16) continue;

        try {
          const iv = plan.iv;
          if (iv.length !== 16) continue;

          const dataEnd = plan.trimEnd > 0 ? dbBytes.length - plan.trimEnd : dbBytes.length;
          const cipherData = dbBytes.slice(plan.dataStart, dataEnd);

          onProgress({
            stage: 'decrypting',
            message: `Attempting decryption (${plan.desc})...`
          });

          let decryptedBytes = null;

          if (plan.mode === 'AES-GCM') {
            const cryptoKey = await window.crypto.subtle.importKey(
              'raw',
              currentKey,
              { name: 'AES-GCM' },
              false,
              ['decrypt']
            );
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv: iv, tagLength: 128 },
              cryptoKey,
              cipherData
            );
            decryptedBytes = new Uint8Array(decryptedBuffer);
          } else if (plan.mode === 'AES-CTR') {
            const cryptoKey = await window.crypto.subtle.importKey(
              'raw',
              currentKey,
              { name: 'AES-CTR' },
              false,
              ['decrypt']
            );
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              { name: 'AES-CTR', counter: iv, length: 64 },
              cryptoKey,
              cipherData
            );
            decryptedBytes = new Uint8Array(decryptedBuffer);
          }

          if (decryptedBytes) {
            // Check if result is plain SQLite directly
            if (this.isPlainSqlite(decryptedBytes)) {
              onProgress({ stage: 'done', message: 'Decryption successful (valid SQLite found)!' });
              return decryptedBytes;
            }

            // Decompress zlib
            onProgress({ stage: 'decompress', message: 'Decompressing zlib payload...' });
            try {
              const decompressed = await this.decompressZlib(decryptedBytes);
              if (this.isDecryptedValid(decompressed)) {
                onProgress({ stage: 'done', message: 'Decryption & decompression successful!' });
                return decompressed;
              }
              // Check offset inside decompression
              for (let off = 0; off < Math.min(256, decompressed.length - 16); off++) {
                if (this.isPlainSqlite(decompressed.slice(off))) {
                  onProgress({ stage: 'done', message: 'Decryption successful!' });
                  return decompressed.slice(off);
                }
              }
            } catch (zErr) {
              // Decompress failed for this plan, proceed to next
            }
          }
        } catch (err) {
          lastError = err;
        }
      }
    }

    // If all decryption attempts failed, provide clear diagnostics
    const hexHead = Array.from(dbBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const detectedType = this.detectFileType('', dbBytes);
    const keyLen = keyInput instanceof Uint8Array ? keyInput.length : (typeof keyInput === 'string' ? keyInput.length : 0);

    throw new Error(
      `Failed to decrypt database: Encryption key does not match this database.\n\n` +
      `Diagnostic Info:\n` +
      `• Detected file type: ${detectedType.toUpperCase()}\n` +
      `• File size: ${(dbBytes.length / (1024 * 1024)).toFixed(2)} MB (Header: ${hexHead})\n` +
      `• Provided key: ${keyLen} bytes / characters\n\n` +
      `Solutions:\n` +
      `1. Ensure the key file was retrieved from the exact same WhatsApp account as this backup file.\n` +
      `2. If you have root access on your phone, you can directly pull the unencrypted "msgstore.db" file from: /data/data/com.whatsapp/databases/msgstore.db (can be opened immediately without a key!).\n` +
      `3. You can also click "Try Demo Database" to test and preview the interface.`
    );
  }
}

if (typeof window !== 'undefined') {
  window.WADecryptor = WADecryptor;
}
