import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// PRODUCTION-READY PDF/DOCX/TXT/CSV EXTRACTOR
// Memory-efficient, chunked processing
// ============================================

// Extract text from PDF binary - lightweight streaming approach
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  console.log(`Processing PDF: ${bytes.length} bytes`);
  
  // Process in small chunks to avoid memory issues
  const CHUNK_SIZE = 256 * 1024; // 256KB chunks
  const MAX_OUTPUT = 100000; // Max 100k chars output
  const extractedParts: string[] = [];
  
  const decoder = new TextDecoder('latin1');
  
  // Process file in chunks
  for (let offset = 0; offset < bytes.length && extractedParts.join('').length < MAX_OUTPUT; offset += CHUNK_SIZE) {
    const chunk = bytes.slice(offset, Math.min(offset + CHUNK_SIZE, bytes.length));
    const content = decoder.decode(chunk);
    
    // Extract text from BT/ET blocks (PDF text operators)
    const btEtPattern = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    
    while ((match = btEtPattern.exec(content)) !== null) {
      const textBlock = match[1];
      
      // Extract from Tj operator (single string)
      const tjPattern = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjPattern.exec(textBlock)) !== null) {
        const decoded = decodeEscapedText(tjMatch[1]);
        if (decoded.trim()) extractedParts.push(decoded);
      }
      
      // Extract from TJ operator (array of strings)
      const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
      while ((tjMatch = tjArrayPattern.exec(textBlock)) !== null) {
        const arrayContent = tjMatch[1];
        const stringPattern = /\(([^)]*)\)/g;
        let strMatch;
        while ((strMatch = stringPattern.exec(arrayContent)) !== null) {
          const decoded = decodeEscapedText(strMatch[1]);
          if (decoded.trim()) extractedParts.push(decoded);
        }
      }
      
      if (extractedParts.join('').length > MAX_OUTPUT) break;
    }
    
    // Also look for readable text in streams
    if (extractedParts.join('').length < 10000) {
      const readablePattern = /[A-Za-z][A-Za-z\s,.'!?;:\-]{20,}/g;
      const readableMatches = content.match(readablePattern);
      if (readableMatches) {
        for (const text of readableMatches.slice(0, 50)) {
          if (!extractedParts.includes(text)) {
            extractedParts.push(text);
          }
        }
      }
    }
  }
  
  // Extract metadata from PDF structure
  const fullContent = decoder.decode(bytes.slice(0, Math.min(50000, bytes.length)));
  const metadataPattern = /\/(?:Title|Subject|Author|Keywords)\s*\(([^)]+)\)/g;
  let metaMatch;
  while ((metaMatch = metadataPattern.exec(fullContent)) !== null) {
    extractedParts.unshift(metaMatch[1]);
  }
  
  const allText = extractedParts.join(' ').replace(/\s+/g, ' ').trim();
  
  // Estimate page count from PDF structure
  const pageMatches = fullContent.match(/\/Type\s*\/Page[^s]/g);
  const estimatedPages = pageMatches ? pageMatches.length : Math.ceil(bytes.length / 50000);
  
  console.log(`Extracted ${allText.length} chars, ~${estimatedPages} pages`);
  
  return formatWithPages(allText, estimatedPages);
}

// Decode PDF escape sequences
function decodeEscapedText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

// Extract text from DOCX XML structure
function extractDocxText(bytes: Uint8Array): string {
  console.log(`Processing DOCX: ${bytes.length} bytes`);
  
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(bytes);
  
  const parts: string[] = [];
  
  // Look for document.xml content (main document text)
  const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  
  while ((match = textPattern.exec(content)) !== null) {
    const text = match[1].trim();
    if (text) parts.push(text);
    if (parts.join(' ').length > 100000) break;
  }
  
  const allText = parts.join(' ').replace(/\s+/g, ' ').trim();
  const estimatedPages = Math.ceil(allText.length / 3000);
  
  console.log(`Extracted ${allText.length} chars from DOCX`);
  
  return formatWithPages(allText, estimatedPages);
}

// Format text with page markers
function formatWithPages(text: string, pageCount: number): string {
  if (!text) return '';
  
  const charsPerPage = Math.ceil(text.length / Math.max(pageCount, 1));
  const chunks: string[] = [];
  
  for (let i = 0; i < pageCount && i * charsPerPage < text.length; i++) {
    const start = i * charsPerPage;
    const end = Math.min((i + 1) * charsPerPage, text.length);
    chunks.push(`[Page ${i + 1}]\n${text.slice(start, end)}`);
  }
  
  return chunks.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let file: File;
    
    // Handle both FormData and raw body
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('file') as File;
    } else {
      throw new Error('Expected multipart/form-data');
    }
    
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = file.name.toLowerCase();
    const fileSize = file.size;
    const fileSizeMB = fileSize / 1024 / 1024;
    
    console.log(`=== Extract Text Request ===`);
    console.log(`File: ${file.name}, Type: ${file.type}, Size: ${fileSizeMB.toFixed(2)}MB`);

    // Validate file type
    const validTypes = ['application/pdf', 'text/plain', 'text/csv', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.txt', '.csv', '.docx'];
    
    const isValidType = validTypes.includes(file.type) || 
      validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      return new Response(
        JSON.stringify({ 
          error: `Unsupported file type: ${file.type || 'unknown'}. Accepted: PDF, DOCX, TXT, CSV` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit processing size for memory safety
    const MAX_PROCESS_SIZE = 5 * 1024 * 1024; // 5MB max for extraction
    const shouldTruncate = fileSize > MAX_PROCESS_SIZE;
    
    let text = '';
    let pageCount = 1;
    let method = 'unknown';
    
    // Process PDF
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      const blob = shouldTruncate ? file.slice(0, MAX_PROCESS_SIZE) : file;
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      text = extractTextFromPdfBytes(bytes);
      pageCount = Math.max(
        (text.match(/\[Page \d+\]/g) || []).length,
        Math.ceil(fileSizeMB * 15)
      );
      method = 'pdf-binary';
    }
    // Process TXT/CSV
    else if (file.type === 'text/plain' || file.type === 'text/csv' || 
             fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      const blob = shouldTruncate ? file.slice(0, 500 * 1024) : file; // 500KB max for text
      text = await blob.text();
      pageCount = Math.ceil(text.length / 3000);
      method = 'text';
      
      // Format with pages
      text = formatWithPages(text, pageCount);
    }
    // Process DOCX
    else if (fileName.endsWith('.docx')) {
      const blob = shouldTruncate ? file.slice(0, MAX_PROCESS_SIZE) : file;
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      text = extractDocxText(bytes);
      pageCount = Math.ceil(text.length / 3000);
      method = 'docx';
    }
    
    // Validate extraction result
    if (!text || text.length < 50) {
      console.log('Warning: Minimal text extracted');
      return new Response(
        JSON.stringify({
          text: `[Document: ${file.name}]\nLimited text could be extracted. The document may be image-based, encrypted, or corrupted.`,
          pageCount: Math.ceil(fileSizeMB * 15),
          method: method + '-limited',
          warning: 'Minimal text extracted - document may be image-based or encrypted',
          partial: shouldTruncate,
          originalSize: fileSize
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`=== Extraction Complete ===`);
    console.log(`Method: ${method}, Chars: ${text.length}, Pages: ${pageCount}`);

    return new Response(
      JSON.stringify({
        text,
        pageCount,
        method,
        partial: shouldTruncate,
        originalSize: fileSize,
        extractedSize: text.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error during text extraction'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
