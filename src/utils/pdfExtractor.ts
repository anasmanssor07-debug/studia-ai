/**
 * Fast client-side PDF text extractor.
 * Extracts textual content from PDF files directly in the browser
 * using lightweight binary stream analysis and native DecompressionStream.
 * Handles trailing PDF stream padding safely without "Junk found after end of compressed data" errors.
 */

async function safeDecompressChunk(rawChunk: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined' || rawChunk.length < 4) {
    return '';
  }

  // Trim leading \r, \n, spaces
  let start = 0;
  while (start < rawChunk.length && (rawChunk[start] === 0x0A || rawChunk[start] === 0x0D || rawChunk[start] === 0x20)) {
    start++;
  }

  // Trim trailing \r, \n, spaces
  let end = rawChunk.length;
  while (end > start && (rawChunk[end - 1] === 0x0A || rawChunk[end - 1] === 0x0D || rawChunk[end - 1] === 0x20)) {
    end--;
  }

  if (end <= start + 4) return '';
  const cleanChunk = rawChunk.subarray(start, end);

  // Helper using Response & pipeThrough which cleanly catches stream errors without unhandled rejections
  const tryFormat = async (format: 'deflate' | 'deflate-raw'): Promise<string> => {
    try {
      const ds = new DecompressionStream(format);
      const stream = new Blob([cleanChunk as any]).stream();
      if (!stream) return '';
      
      const decompressedStream = stream.pipeThrough(ds);
      const response = new Response(decompressedStream);
      const buffer = await response.arrayBuffer();
      return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    } catch {
      // Catch any decompression errors (e.g. junk after compressed data, bad zlib headers)
      return '';
    }
  };

  // Try zlib deflate first, then raw deflate
  let decoded = await tryFormat('deflate');
  if (!decoded) {
    decoded = await tryFormat('deflate-raw');
  }

  return decoded;
}

export async function extractTextFromPdfFile(file: File): Promise<{ text: string; pageCountEstimate: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const latin1Text = new TextDecoder('latin1').decode(bytes);

    // Estimate page count
    const pageMatches = latin1Text.match(/\/Type\s*\/Page\b/g);
    const pageCountEstimate = pageMatches ? pageMatches.length : 1;

    const extractedChunks: string[] = [];

    // 1. Direct uncompressed text extraction (BT ... ET blocks)
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match: RegExpExecArray | null;

    while ((match = btRegex.exec(latin1Text)) !== null) {
      const block = match[1];
      const textMatches = block.match(/\((.*?)\)\s*T[jJ]|\[(.*?)\]\s*TJ/g);
      if (textMatches) {
        for (const tm of textMatches) {
          const cleaned = tm
            .replace(/^\s*\[?\(?|\)?\s*T[jJ]\]?\s*$/g, '')
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ');
          if (cleaned.trim().length > 1) {
            extractedChunks.push(cleaned.trim());
          }
        }
      }
    }

    let combined = extractedChunks.join(' ');
    if (combined.length > 300) {
      combined = combined.replace(/\s+/g, ' ').slice(0, 45000);
      return { text: combined, pageCountEstimate };
    }

    // 2. Safe decompression of FlateDecode streams
    if (typeof DecompressionStream !== 'undefined') {
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let streamMatch: RegExpExecArray | null;
      let decompressedText = '';
      let streamsChecked = 0;

      while ((streamMatch = streamRegex.exec(latin1Text)) !== null && streamsChecked < 25) {
        streamsChecked++;
        const streamKeywordPos = streamMatch.index;
        
        // Check for explicit /Length in the stream dictionary before "stream"
        const preStream = latin1Text.slice(Math.max(0, streamKeywordPos - 250), streamKeywordPos);
        const lenMatch = preStream.match(/\/Length\s+(\d+)\b/);

        let streamStart = streamKeywordPos + streamMatch[0].indexOf('\n') + 1;
        let streamEnd = streamKeywordPos + streamMatch[0].lastIndexOf('endstream');

        if (lenMatch) {
          const explicitLength = parseInt(lenMatch[1], 10);
          if (explicitLength > 0 && streamStart + explicitLength <= bytes.length) {
            streamEnd = streamStart + explicitLength;
          }
        }

        if (streamEnd > streamStart) {
          try {
            const rawChunk = bytes.subarray(streamStart, streamEnd);
            const decoded = await safeDecompressChunk(rawChunk);

            if (decoded) {
              const streamBtRegex = /BT\s*([\s\S]*?)\s*ET/g;
              let sm: RegExpExecArray | null;
              while ((sm = streamBtRegex.exec(decoded)) !== null) {
                const textMatches = sm[1].match(/\((.*?)\)\s*T[jJ]|\[(.*?)\]\s*TJ/g);
                if (textMatches) {
                  for (const tm of textMatches) {
                    const cleaned = tm
                      .replace(/^\s*\[?\(?|\)?\s*T[jJ]\]?\s*$/g, '')
                      .replace(/\\([()\\])/g, '$1');
                    if (cleaned.trim().length > 1) {
                      decompressedText += ' ' + cleaned.trim();
                    }
                  }
                }
              }
            }
          } catch {
            // Silently skip any individual stream that fails decompression
          }
        }

        if (decompressedText.length > 30000) break;
      }

      if (decompressedText.trim().length > 150) {
        return {
          text: decompressedText.replace(/\s+/g, ' ').slice(0, 45000),
          pageCountEstimate,
        };
      }
    }

    return {
      text: combined.slice(0, 30000),
      pageCountEstimate,
    };
  } catch (err) {
    console.warn('Fast client-side PDF text extraction skipped:', err);
    return { text: '', pageCountEstimate: 1 };
  }
}
