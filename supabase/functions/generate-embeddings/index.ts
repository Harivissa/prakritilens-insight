import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into manageable pieces
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - overlap; // Overlap for context continuity
  }
  
  return chunks;
}

// Estimate page number from text position
function estimatePageNumber(chunkIndex: number, totalChunks: number, pageCount: number): number {
  return Math.floor((chunkIndex / totalChunks) * pageCount) + 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { reportId, documentText, pageCount } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Generating embeddings for report:', reportId, 'Pages:', pageCount);

    // Delete existing embeddings for this report
    await supabaseClient
      .from('document_embeddings')
      .delete()
      .eq('report_id', reportId);

    // Chunk the document
    const chunks = chunkText(documentText);
    console.log('Created', chunks.length, 'chunks');

    // Generate embeddings in batches
    const batchSize = 10;
    const embeddings: any[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Call OpenAI embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small', // 1536 dimensions, but we'll use a smaller model
          input: batch,
          dimensions: 384 // Reduce dimensions to match our vector size
        }),
      });

      const data = await response.json();
      
      if (!data.data) {
        console.error('Invalid embedding response:', data);
        continue;
      }

      // Prepare batch for insertion
      const batchEmbeddings = data.data.map((item: any, idx: number) => ({
        report_id: reportId,
        user_id: user.id,
        chunk_text: batch[idx],
        chunk_index: i + idx,
        page_number: estimatePageNumber(i + idx, chunks.length, pageCount || 50),
        embedding: JSON.stringify(item.embedding), // Will be converted to vector by Postgres
        metadata: {
          chunk_length: batch[idx].length,
          batch: Math.floor(i / batchSize)
        }
      }));

      embeddings.push(...batchEmbeddings);
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }

    // Insert all embeddings
    const { error: insertError } = await supabaseClient
      .from('document_embeddings')
      .insert(embeddings);

    if (insertError) {
      console.error('Error inserting embeddings:', insertError);
      throw insertError;
    }

    console.log('Successfully generated', embeddings.length, 'embeddings');

    return new Response(
      JSON.stringify({
        success: true,
        chunks: embeddings.length,
        reportId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-embeddings:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});