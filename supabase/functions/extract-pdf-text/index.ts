import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF binary - lightweight text stream extraction
// Only processes first portion for validation to avoid memory limits
function extractTextFromPdfBytes(bytes: Uint8Array, maxBytes: number = 2 * 1024 * 1024): string {
  // Only process first portion to avoid memory limits
  const processBytes = bytes.slice(0, Math.min(bytes.length, maxBytes));
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(processBytes);
  
  const extractedParts: string[] = [];
  
  // Find text between BT (begin text) and ET (end text) operators
  const btEtPattern = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  
  while ((match = btEtPattern.exec(content)) !== null) {
    const textBlock = match[1];
    
    // Extract text from Tj and TJ operators
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    const tjArrayPattern = /\[(.*?)\]\s*TJ/g;
    
    let tjMatch;
    let blockText = '';
    
    while ((tjMatch = tjPattern.exec(textBlock)) !== null) {
      blockText += decodeEscapedText(tjMatch[1]) + ' ';
    }
    
    while ((tjMatch = tjArrayPattern.exec(textBlock)) !== null) {
      const arrayContent = tjMatch[1];
      const stringPattern = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = stringPattern.exec(arrayContent)) !== null) {
        blockText += decodeEscapedText(strMatch[1]);
      }
      blockText += ' ';
    }
    
    if (blockText.trim()) {
      extractedParts.push(blockText.trim());
    }
    
    // Stop if we have enough text for validation
    if (extractedParts.join(' ').length > 50000) break;
  }
  
  // If BT/ET extraction didn't work, try stream content
  if (extractedParts.join(' ').length < 1000) {
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    while ((match = streamPattern.exec(content)) !== null && extractedParts.join(' ').length < 50000) {
      const streamContent = match[1];
      // Look for readable ASCII text
      const readableText = streamContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (readableText.length > 50) {
        // Check if it looks like actual text (has words)
        const words = readableText.split(/\s+/).filter(w => w.length > 2 && /^[a-zA-Z]+$/.test(w));
        if (words.length > 3) {
          extractedParts.push(readableText.substring(0, 2000));
        }
      }
    }
  }
  
  // Also extract any plain text visible in the PDF structure
  const plainTextPattern = /\/(?:Title|Subject|Author|Keywords|Producer|Creator)\s*\(([^)]+)\)/g;
  while ((match = plainTextPattern.exec(content)) !== null) {
    extractedParts.unshift(match[1]); // Add metadata at the beginning
  }
  
  const allText = extractedParts.join('\n');
  
  // Group into rough pages
  const chunks = allText.match(/.{1,3000}/gs) || [];
  return chunks.slice(0, 50).map((chunk, i) => `[Page ${i + 1}]\n${chunk}`).join('\n\n');
}

// Decode escaped characters in PDF strings
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

// Extract DOCX text from XML content
function extractDocxText(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(bytes);
  
  // Extract text between XML tags
  const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const parts: string[] = [];
  let match;
  
  while ((match = textPattern.exec(content)) !== null) {
    if (match[1].trim()) {
      parts.push(match[1]);
    }
    if (parts.join(' ').length > 100000) break;
  }
  
  return parts.join(' ') || content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 100000).trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    const fileSizeMB = file.size / 1024 / 1024;
    console.log('Extracting text from:', file.name, file.type, `${fileSizeMB.toFixed(2)}MB`);

    // Check file size - for very large files, we only need first portion for validation
    const isLargeFile = fileSizeMB > 5;
    
    // For PDF files
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        console.log('Processing PDF with binary extraction...');
        
        // For large files, only read first 3MB for validation
        const maxReadSize = isLargeFile ? 3 * 1024 * 1024 : file.size;
        const blob = file.slice(0, maxReadSize);
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        console.log(`Reading ${(bytes.length / 1024 / 1024).toFixed(2)}MB of PDF data`);
        
        const extractedText = extractTextFromPdfBytes(bytes);
        const textLength = extractedText.length;
        
        console.log(`Extracted ${textLength} chars from PDF`);
        
        // Estimate page count based on file size (rough estimate ~50KB per page for ESG reports)
        const estimatedPageCount = Math.max(
          (extractedText.match(/\[Page \d+\]/g) || []).length,
          Math.ceil(fileSizeMB * 20) // Rough estimate
        );
        
        if (textLength < 100) {
          // Very little text extracted - PDF might be image-based
          console.log('Minimal text extracted - PDF may be image-based or encrypted');
          return new Response(
            JSON.stringify({
              text: `[Document: ${file.name}]\nThis PDF appears to be image-based or encrypted. Limited text could be extracted for validation.\nFile size: ${fileSizeMB.toFixed(2)}MB\nEstimated pages: ${estimatedPageCount}`,
              pageCount: estimatedPageCount,
              method: 'binary-limited',
              warning: 'Image-based or encrypted PDF'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            text: extractedText,
            pageCount: estimatedPageCount,
            method: 'binary',
            partial: isLargeFile
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
        
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        throw new Error(`PDF extraction failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      }
    }

    // For text files
    if (file.type === 'text/plain' || file.type === 'text/csv' || 
        file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      // For large text files, only read first portion
      const maxTextSize = 500 * 1024; // 500KB should be plenty for validation
      const blob = file.slice(0, Math.min(file.size, maxTextSize));
      const text = await blob.text();
      const pageCount = Math.ceil(file.size / 3000);
      
      console.log(`Extracted ${text.length} characters from text file`);
      
      return new Response(
        JSON.stringify({
          text,
          pageCount,
          method: 'text',
          partial: file.size > maxTextSize
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For DOCX files
    if (file.name.endsWith('.docx')) {
      const maxDocxSize = 2 * 1024 * 1024; // 2MB for DOCX
      const blob = file.slice(0, Math.min(file.size, maxDocxSize));
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const text = extractDocxText(bytes);
      const pageCount = Math.ceil(file.size / 5000);
      
      console.log(`Extracted ${text.length} characters from DOCX`);
      
      return new Response(
        JSON.stringify({
          text,
          pageCount,
          method: 'docx',
          partial: file.size > maxDocxSize
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    throw new Error(`Unsupported file type: ${file.type}. Supported: PDF, TXT, CSV, DOCX`);

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred during text extraction'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
