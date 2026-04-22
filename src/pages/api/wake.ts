export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const apiUrl = import.meta.env.AI_AGENT_URL;
    
    // Hacemos un fetch sin 'await' y capturamos errores silenciosamente.
    // No nos importa qué responda la API (incluso si da error 404 o 405),
    // el simple hecho de que la petición llegue al servidor de Render lo obligará a encenderse.
    fetch(apiUrl).catch(() => {});

    return new Response(JSON.stringify({ status: "waking up Render..." }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error" }), { status: 500 });
  }
};