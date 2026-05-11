// Função removida por questões de segurança
// Este endpoint não está mais disponível

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      error: 'Esta função foi removida por questões de segurança' 
    }),
    { 
      status: 410, // Gone
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
});
