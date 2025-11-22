import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Extracting text from:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

    // For PDF files, use pdfjs-dist via esm.sh
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Import pdfjs from esm.sh which handles dependencies properly
        const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379');
        
        // Set worker - use unpkg CDN which has reliable worker file hosting
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        const numPages = Math.min(pdf.numPages, 100);
        console.log(`Processing ${numPages} pages...`);
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullText += `\n[Page ${i}]\n${pageText}`;
        }
        
        if (!fullText || fullText.trim().length === 0) {
          throw new Error('No text could be extracted. PDF may be image-based or password-protected.');
        }

        console.log(`Successfully extracted ${fullText.length} characters from ${pdf.numPages} pages`);
        
        return new Response(
          JSON.stringify({
            text: fullText,
            pageCount: pdf.numPages
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
      const text = await file.text();
      const pageCount = Math.ceil(text.length / 3000);
      
      console.log(`Extracted ${text.length} characters from text file`);
      
      return new Response(
        JSON.stringify({
          text,
          pageCount
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For DOCX files - use simple extraction
    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      // Basic DOCX text extraction (you can enhance this later)
      const text = new TextDecoder().decode(arrayBuffer);
      const pageCount = Math.ceil(text.length / 3000);
      
      console.log(`Extracted ${text.length} characters from DOCX`);
      
      return new Response(
        JSON.stringify({
          text,
          pageCount
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
