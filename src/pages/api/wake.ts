export const prerender = false;
import type { APIRoute } from 'astro';

/**
 * Despierta el servicio de Render free.
 *
 * El problema del fire-and-forget original (`fetch(...).catch(() => {})` sin
 * await) es que Vercel CONGELA la función en cuanto devuelve la respuesta, así
 * que la petición a Render se cancelaba a mitad. Aquí esperamos de verdad y le
 * damos a la función el tiempo máximo permitido en el plan gratuito.
 */
export const maxDuration = 60;

const WAKE_TIMEOUT_MS = 45_000;

/**
 * `AI_AGENT_URL` apunta a `/chat`, que solo acepta POST. Para despertar el
 * servicio usamos la raíz, que responde a GET y no requiere API key.
 */
function healthUrlFor(apiUrl: string) {
  return apiUrl.replace(/\/chat\/?$/, '/');
}

export const GET: APIRoute = async () => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const apiUrl = import.meta.env.AI_AGENT_URL;
  if (!apiUrl) {
    return json({ status: 'error', reason: 'AI_AGENT_URL no esta configurada' }, 500);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(healthUrlFor(apiUrl), {
      method: 'GET',
      signal: controller.signal,
    });

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`🟢 Render respondio ${response.status} en ${elapsed}s`);

    return json({
      status: response.ok ? 'awake' : 'degraded',
      httpStatus: response.status,
      elapsedSeconds: Number(elapsed),
    });
  } catch (error) {
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    const aborted =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');
    console.error('🔴 Wake fallido:', error);
    return json({
      status: aborted ? 'timeout' : 'error',
      elapsedSeconds: Number(elapsed),
    });
  } finally {
    clearTimeout(timer);
  }
};
