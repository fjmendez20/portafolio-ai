export const prerender = false;
import type { APIRoute } from 'astro';

const API_TIMEOUT_MS = 45_000;
const FALLBACK_REPLY =
  'Estoy recibiendo mucha demanda en este momento. ¿Podrías intentar de nuevo en unos segundos?';

function agentHeaders(apiKey: string | undefined) {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': `${apiKey}`,
  };
}

/**
 * `AI_AGENT_URL` ya apunta a `/chat`, así que no podemos concatenar sin más o
 * generaríamos `/chat/chat/stream`.
 */
function streamUrlFor(apiUrl: string) {
  return apiUrl.replace(/\/chat\/?$/, '/chat/stream');
}

/** Cierra el stream liberando el lock del body si el cliente aborta. */
const cancelBody = (body: ReadableStream<Uint8Array> | null) => {
  if (body && 'cancel' in body) {
    body.cancel().catch(() => {});
  }
};

export const POST: APIRoute = async ({ request }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const data = await request.json();
    const userMessage = data.message;
    // 1. Recibimos el ID seguro directamente desde el navegador del usuario
    const sessionId = data.session_id;

    if (!userMessage || !sessionId) {
      return new Response(
        JSON.stringify({ reply: 'Mensaje inválido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiUrl = import.meta.env.AI_AGENT_URL;
    const apiKey = import.meta.env.AI_AGENT_API_KEY;

    console.log(`🟡 1. Frontend envió: "${userMessage}" | Sesión: ${sessionId}`);

    const isStream = request.headers.get('accept')?.includes('text/event-stream');

    const upstream = await fetch(
      isStream ? streamUrlFor(apiUrl) : apiUrl,
      {
        method: 'POST',
        headers: {
          ...agentHeaders(apiKey),
          ...(isStream ? { Accept: 'text/event-stream' } : {}),
        },
        body: JSON.stringify({ message: userMessage, session_id: sessionId }),
        signal: controller.signal,
      }
    );

    console.log('🟡 2. Código HTTP de Render:', upstream.status);

    // 3. Si el agente no está bien, lo manejamos AQUÍ. Antes se hacía
    // response.json() a ciegas y un 500 de Render pintaba una burbuja vacía
    // porque el body era { detail: ... } y no tenía la clave `response`.
    if (!upstream.ok) {
      if (isStream) {
        cancelBody(upstream.body);
        return new Response(
          `event: error\ndata: ${JSON.stringify({ message: FALLBACK_REPLY })}\n\n`,
          {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'X-Accel-Buffering': 'no',
            },
          }
        );
      }

      let detail = '';
      try {
        const err = await upstream.json();
        detail = err?.detail ?? '';
      } catch {
        detail = '';
      }
      console.error('🔴 Render respondió con error:', upstream.status, detail);
      return new Response(JSON.stringify({ reply: FALLBACK_REPLY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Streaming: reenviamos los bytes sin buffer para que los tokens
    // lleguen al navegador a medida que Gemini los genera.
    if (isStream) {
      if (!upstream.body) {
        return new Response(
          `event: error\ndata: ${JSON.stringify({ message: FALLBACK_REPLY })}\n\n`,
          {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
          }
        );
      }

      const reader = upstream.body.getReader();

      const stream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          } catch (error) {
            console.error('🔴 Stream interrumpido:', error);
            const payload = `event: error\ndata: ${JSON.stringify({ message: FALLBACK_REPLY })}\n\n`;
            controller.enqueue(new TextEncoder().encode(payload));
            controller.close();
          }
        },
        cancel(reason) {
          console.log('🟡 Cliente canceló el stream:', reason);
          reader.cancel(reason).catch(() => {});
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // 5. Camino clásico: respuesta JSON completa.
    const aiResult = await upstream.json();
    const botReply = aiResult?.response?.trim();

    if (!botReply) {
      console.error('🔴 Render respondió 200 sin texto en `response`:', aiResult);
      return new Response(JSON.stringify({ reply: FALLBACK_REPLY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply: botReply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🔴 ERROR CRÍTICO EN BACKEND:', error);
    const aborted =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');
    const message = aborted
      ? 'La respuesta está tardando demasiado. ¿Puedes intentarlo de nuevo?'
      : FALLBACK_REPLY;

    // El cliente pidió streaming, así que la respuesta debe hablar SSE o no
    // podrá interpretar nada y se quedaría esperando eternamente.
    if (request.headers.get('accept')?.includes('text/event-stream')) {
      return new Response(`event: error\ndata: ${JSON.stringify({ message })}\n\n`, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    return new Response(JSON.stringify({ reply: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
  }
};
