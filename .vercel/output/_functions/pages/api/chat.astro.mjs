export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const userMessage = data.message;
    const sessionId = data.session_id;
    console.log(`🟡 1. Frontend envió: "${userMessage}" | Sesión: ${sessionId}`);
    const apiUrl = "https://agent-react-portfolio.onrender.com/chat";
    const apiKey = "FM_NzcfVGMpWDEpj0Q9VUB0vmOaxPwjM3uoPbM0yS10kxfDpd3Ah1";
    console.log("🟡 2. Llamando a la API en:", apiUrl);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": `${apiKey}`
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
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("🔴 ERROR CRÍTICO EN BACKEND:", error);
    return new Response(JSON.stringify({
      reply: "Error de conexión con el agente."
    }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
