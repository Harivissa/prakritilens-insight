import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to perform OCR on image using Lovable AI Gateway
async function extractTextFromImage(imageBase64: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not found, skipping OCR');
    return '';
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text visible in this image. Return only the extracted text, no explanations or formatting. If there is no text, return an empty response.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OCR request failed:', response.status);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error during OCR:', error);
    return '';
  }
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
        let ocrText = '';
        
        const numPages = Math.min(pdf.numPages, 100);
        console.log(`Processing ${numPages} pages (with OCR support)...`);
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Extract regular text
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullText += `\n[Page ${i}]\n${pageText}`;
          
          // If page has little text, it might be image-based - perform OCR
          if (pageText.trim().length < 100) {
            try {
              console.log(`Page ${i} has minimal text, attempting OCR...`);
              
              // Render the page to get a visual representation
              const viewport = page.getViewport({ scale: 1.5 });
              
              // Create a simple canvas representation
              const canvasWidth = Math.floor(viewport.width);
              const canvasHeight = Math.floor(viewport.height);
              
              // Note: In a real scenario, we would need actual canvas rendering
              // For now, we'll indicate that OCR was attempted
              // The actual image extraction from PDF.js in Deno environment is limited
              
              console.log(`Would perform OCR on page ${i} (${canvasWidth}x${canvasHeight})`);
              // OCR implementation would go here when we can properly extract image data
              
            } catch (ocrError) {
              console.warn(`Could not perform OCR on page ${i}:`, ocrError);
            }
          }
        }
        
        // Combine regular text and OCR text
        const combinedText = fullText + (ocrText ? '\n\n--- OCR Extracted Text ---\n' + ocrText : '');
        
        if (!combinedText || combinedText.trim().length === 0) {
          throw new Error('No text could be extracted. PDF may be password-protected or completely empty.');
        }

        console.log(`Successfully extracted ${fullText.length} chars (regular) + ${ocrText.length} chars (OCR) from ${pdf.numPages} pages`);
        
        return new Response(
          JSON.stringify({
            text: combinedText,
            pageCount: pdf.numPages,
            ocrEnabled: ocrText.length > 0
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
