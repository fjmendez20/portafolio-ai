export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const userMessage = data.message;
    // 1. Recibimos el ID seguro directamente desde el navegador del usuario
    const sessionId = data.session_id; 
    
    console.log(`🟡 1. Frontend envió: "${userMessage}" | Sesión: ${sessionId}`);

    const apiUrl = import.meta.env.AI_AGENT_URL;
    const apiKey = import.meta.env.AI_AGENT_API_KEY;

    console.log("🟡 2. Llamando a la API en:", apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': `${apiKey}` 
      },
      body: JSON.stringify({
        message: userMessage, 
        session_id: sessionId 
      })
    });
    
    console.log("🟡 3. Código HTTP de respuesta:", response.status);
    const aiResult = await response.json();
    console.log("🟢 4. JSON COMPLETO de tu API:", JSON.stringify(aiResult, null, 2));

    const botReply = aiResult.response;
    
    return new Response(JSON.stringify({ reply: botReply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("🔴 ERROR CRÍTICO EN BACKEND:", error);
    return new Response(JSON.stringify({ 
      reply: "Error de conexión con el agente." 
    }), { status: 500 });
  }
};